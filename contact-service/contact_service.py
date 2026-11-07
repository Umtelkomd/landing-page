"""UMTELKOMD contact form relay.

Receives the website's contact/application forms (multipart POST /api/contact)
and forwards them by e-mail through SMTP. Nothing is stored on disk.
Standard library only (Python >= 3.10). Binds to 127.0.0.1 behind nginx.

Recipients are fixed in server configuration; the browser cannot choose them.
"""
import email.parser
import email.policy
import json
import os
import re
import smtplib
import sys
import threading
import time
from dataclasses import dataclass, field
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PATH = "/api/contact"
MAX_BODY = 6 * 1024 * 1024
MAX_CV = 5 * 1024 * 1024
MAX_SUMMARY = 5000
RATE_MAX = 5
RATE_WINDOW = 600  # seconds
RATE_MAX_KEYS = 10_000  # tracked sender IPs; the least recently seen are dropped first
SOCKET_TIMEOUT = 15  # seconds per client socket read
SMTP_TIMEOUT = 10  # seconds per SMTP socket operation; well under nginx proxy_read_timeout (30s)
# Requests whose body is being read, parsed or sent at the same time. One 5 MB CV peaks at about
# 60 MB in the stdlib MIME parser (70-80 MB RSS per request), so 2 slots fit MemoryMax=256M.
MAX_CONCURRENT = 2
BODY_SLOTS = threading.BoundedSemaphore(MAX_CONCURRENT)

SUBJECTS = {
    "biz": "Projektanfrage über umtelkomd.net",
    "job": "Bewerbung / Partneranfrage über umtelkomd.net",
}
# extension -> (MIME type, accepted leading bytes)
CV_TYPES = {
    "pdf": ("application/pdf", (b"%PDF",)),
    "doc": ("application/msword", (b"\xd0\xcf\x11\xe0",)),
    "docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", (b"PK\x03\x04",)),
    "jpg": ("image/jpeg", (b"\xff\xd8\xff",)),
    "jpeg": ("image/jpeg", (b"\xff\xd8\xff",)),
    "png": ("image/png", (b"\x89PNG",)),
}
EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
CONTROL_RE = re.compile(r"[\x00-\x1f\x7f]")


class Rejected(Exception):
    def __init__(self, status, error):
        super().__init__(error)
        self.status, self.error = status, error


@dataclass
class Config:
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    mail_from: str
    mail_to: list = field(default_factory=list)
    port: int = 8787

    @classmethod
    def from_env(cls, env=os.environ):
        # Two modes: login (SMTP_USER + SMTP_PASSWORD) or IP-allowlisted relay such as
        # smtp-relay.gmail.com (no credentials, MAIL_FROM required).
        if env.get("SMTP_PASSWORD") and not env.get("SMTP_USER"):
            sys.exit("contact-service: SMTP_PASSWORD is set but SMTP_USER is missing")
        required = ["MAIL_TO"] + (["SMTP_PASSWORD"] if env.get("SMTP_USER") else ["MAIL_FROM", "SMTP_HOST"])
        missing = [k for k in required if not env.get(k)]
        if missing:
            sys.exit(f"contact-service: missing configuration: {', '.join(missing)}")
        return cls(
            smtp_host=env.get("SMTP_HOST", "smtp.gmail.com"),
            smtp_port=int(env.get("SMTP_PORT", "587")),
            smtp_user=env.get("SMTP_USER", ""),
            smtp_password=env.get("SMTP_PASSWORD", ""),
            mail_from=env.get("MAIL_FROM") or env["SMTP_USER"],
            mail_to=[a.strip() for a in env["MAIL_TO"].split(",") if a.strip()],
            port=int(env.get("PORT", "8787")),
        )


class RateLimiter:
    """At most RATE_MAX recorded hits per key in RATE_WINDOW seconds.

    Memory is bounded: keys are kept in order of their last hit, expired keys are pruned on
    every recorded hit, and at most max_keys keys are tracked (least recently hit dropped first).
    """

    def __init__(self, max_keys=RATE_MAX_KEYS):
        self._hits, self._lock, self._max_keys = {}, threading.Lock(), max_keys

    def __len__(self):
        with self._lock:
            return len(self._hits)

    def reset(self):
        with self._lock:
            self._hits.clear()

    def _recent(self, key, now):
        return [t for t in self._hits.get(key, ()) if now - t < RATE_WINDOW]

    def _prune(self, now):
        while self._hits:  # oldest last hit first, so stop at the first live key
            key = next(iter(self._hits))
            if now - self._hits[key][-1] < RATE_WINDOW:
                break
            del self._hits[key]

    def exhausted(self, key, now=None):
        """True if key has no quota left. Records nothing."""
        now = time.monotonic() if now is None else now
        with self._lock:
            return len(self._recent(key, now)) >= RATE_MAX

    def allow(self, key, now=None):
        """Record one hit for key if it has quota left; return whether it had."""
        now = time.monotonic() if now is None else now
        with self._lock:
            self._prune(now)
            hits = self._recent(key, now)
            if len(hits) >= RATE_MAX:
                return False
            hits.append(now)
            self._hits.pop(key, None)  # re-insert at the end: most recently hit
            while len(self._hits) >= self._max_keys:
                del self._hits[next(iter(self._hits))]
            self._hits[key] = hits
            return True


LIMITER = RateLimiter()


def parse_multipart(content_type, body):
    if not content_type.lower().startswith("multipart/form-data"):
        raise Rejected(400, "bad_request")
    head = f"MIME-Version: 1.0\r\nContent-Type: {content_type}\r\n\r\n".encode()
    msg = email.parser.BytesParser(policy=email.policy.HTTP).parsebytes(head + body)
    if not msg.is_multipart():
        raise Rejected(400, "bad_request")
    fields, files = {}, {}
    for part in msg.iter_parts():
        name = part.get_param("name", header="content-disposition")
        if not name:
            continue
        data = part.get_payload(decode=True) or b""
        filename = part.get_filename()
        if filename is not None:
            files[name] = (filename, data)
        else:
            fields[name] = data.decode("utf-8", "replace")
    return fields, files


def validate(fields, files):
    form = fields.get("form", "")
    if form not in SUBJECTS:
        raise Rejected(400, "invalid_form")
    name = fields.get("name", "").strip()
    if not name or len(name) > 120 or CONTROL_RE.search(name):
        raise Rejected(400, "invalid_name")
    addr = fields.get("email", "").strip()
    if len(addr) > 254 or not addr.isascii() or not EMAIL_RE.fullmatch(addr):
        raise Rejected(400, "invalid_email")
    summary = fields.get("summary", "").replace("\r\n", "\n").strip()
    if len(summary) > MAX_SUMMARY:
        raise Rejected(400, "invalid_summary")
    cv = None
    if "cv" in files and files["cv"][1]:
        if form != "job":
            raise Rejected(400, "invalid_file")
        filename, data = files["cv"]
        base = re.sub(r"[^A-Za-z0-9._-]+", "_", os.path.basename(filename.replace("\\", "/")))[-80:] or "datei"
        ext = base.rsplit(".", 1)[-1].lower() if "." in base else ""
        if ext not in CV_TYPES or len(data) > MAX_CV:
            raise Rejected(400, "invalid_file")
        ctype, magics = CV_TYPES[ext]
        if not data.startswith(magics):
            raise Rejected(400, "invalid_file")
        cv = (base, ctype, data)
    return {"form": form, "name": name, "email": addr, "summary": summary, "cv": cv}


def build_message(cfg, data):
    msg = EmailMessage()
    msg["From"] = cfg.mail_from
    msg["To"] = ", ".join(cfg.mail_to)
    msg["Reply-To"] = data["email"]
    msg["Subject"] = f"{SUBJECTS[data['form']]} – {data['name']}"
    msg.set_content(
        f"Name: {data['name']}\nE-Mail: {data['email']}\n\n{data['summary']}\n\n— gesendet über umtelkomd.net\n"
    )
    if data["cv"]:
        filename, ctype, payload = data["cv"]
        maintype, subtype = ctype.split("/", 1)
        msg.add_attachment(payload, maintype=maintype, subtype=subtype, filename=filename)
    return msg


def send(cfg, msg):
    with smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=SMTP_TIMEOUT) as smtp:
        smtp.starttls()
        if cfg.smtp_user:  # relay mode authenticates by server IP, not by login
            smtp.login(cfg.smtp_user, cfg.smtp_password)
        smtp.send_message(msg)


def make_handler(cfg):
    class Handler(BaseHTTPRequestHandler):
        server_version = "contact-service"
        sys_version = ""
        timeout = SOCKET_TIMEOUT  # per socket read: slow clients cannot hold a thread forever

        def reply(self, status, payload):
            raw = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            if self.close_connection:
                self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(raw)

        def fail(self, status, error):
            self.reply(status, {"ok": False, "error": error})

        def reject_unread(self, status, error, length):
            """Answer before reading the body, then discard a bounded amount of it and close.

            Discarding lets the client finish sending and read the answer; it is done in
            small chunks, so the body is never held in memory.
            """
            self.close_connection = True
            self.fail(status, error)
            remaining = length if length <= 4 * MAX_BODY else 0
            try:
                while remaining > 0:
                    chunk = self.rfile.read(min(remaining, 64 * 1024))
                    if not chunk:
                        break
                    remaining -= len(chunk)
            except OSError:
                pass

        def do_GET(self):
            self.fail(404, "not_found")

        def do_POST(self):
            try:
                if self.path.split("?", 1)[0] != PATH:
                    raise Rejected(404, "not_found")
                length = int(self.headers.get("Content-Length") or 0)
                if length < 0:
                    self.close_connection = True
                    raise Rejected(400, "bad_request")
                if length > MAX_BODY:
                    return self.reject_unread(413, "too_large", length)
                slots = BODY_SLOTS
                if not slots.acquire(blocking=False):  # bounds memory under concurrent uploads
                    return self.reject_unread(503, "busy", length)
                try:
                    self.process(length)
                finally:
                    slots.release()
            except Rejected as r:
                self.fail(r.status, r.error)
            except ValueError:
                self.fail(400, "bad_request")

        def process(self, length):
            body = self.rfile.read(length)
            ip = self.headers.get("X-Real-IP") or self.client_address[0]
            if LIMITER.exhausted(ip):  # cheap early guard: no parsing for senders without quota
                raise Rejected(429, "rate_limited")
            fields, files = parse_multipart(self.headers.get("Content-Type", ""), body)
            del body
            if fields.get("website", "").strip():  # honeypot: bots fill it, people never see it
                return self.reply(200, {"ok": True})
            data = validate(fields, files)
            del fields, files
            # Only requests that are about to be sent use up quota.
            if not LIMITER.allow(ip):
                raise Rejected(429, "rate_limited")
            msg = build_message(cfg, data)
            del data  # free parse buffers before the (slow) SMTP send
            try:
                send(cfg, msg)
            except (OSError, smtplib.SMTPException) as exc:
                self.log_error("send failed: %s", type(exc).__name__)
                raise Rejected(502, "send_failed")
            self.reply(200, {"ok": True})

        def log_message(self, fmt, *args):  # no personal data in logs: method, path, status only
            sys.stderr.write("contact-service: " + (fmt % args) + "\n")

        def log_request(self, code="-", size="-"):
            self.log_message('"%s %s" %s', self.command, self.path.split("?", 1)[0], code)

    return Handler


def main():
    cfg = Config.from_env()
    server = ThreadingHTTPServer(("127.0.0.1", cfg.port), make_handler(cfg))
    print(f"contact-service listening on 127.0.0.1:{cfg.port}", file=sys.stderr)
    server.serve_forever()


if __name__ == "__main__":
    main()
