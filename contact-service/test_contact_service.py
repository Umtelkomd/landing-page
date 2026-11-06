"""Tests for the contact form relay. Run: python3 -m unittest -v (from contact-service/)."""
import io
import json
import socket
import threading
import time
import unittest
import urllib.error
import urllib.request
import uuid
from http.server import ThreadingHTTPServer
from unittest import mock

import contact_service as cs

PDF = b"%PDF-1.4\n%fake cv\n"
CONFIG = cs.Config(
    smtp_host="smtp.example.test", smtp_port=587, smtp_user="web@umtelkomd.com",
    smtp_password="secret", mail_from="web@umtelkomd.com",
    mail_to=["administration@umtelkomd.com", "ihorstmann@umtelkomd.com"],
)


def multipart(fields, files=()):
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for k, v in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for name, filename, ctype, data in files:
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
                  f"Content-Type: {ctype}\r\n\r\n".encode() + data + b"\r\n")
    out.write(f"--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


def read_response(sock):
    """Read one HTTP response (head, body) using Content-Length, without waiting for close."""
    buf = b""
    while b"\r\n\r\n" not in buf:
        chunk = sock.recv(4096)
        if not chunk:
            break
        buf += chunk
    head, _, body = buf.partition(b"\r\n\r\n")
    head = head.decode()
    length = int(next(l.split(":", 1)[1] for l in head.splitlines() if l.lower().startswith("content-length:")))
    while len(body) < length:
        chunk = sock.recv(4096)
        if not chunk:
            break
        body += chunk
    return head, body


def valid(**over):
    f = {"form": "biz", "name": "Erika Muster", "email": "erika@example.de",
         "summary": "Leistungen: Tiefbau\nRegion: Höxter", "website": ""}
    f.update(over)
    return f


class Base(unittest.TestCase):
    def setUp(self):
        self.sent = []
        smtp = mock.MagicMock()
        smtp.return_value.__enter__.return_value.send_message.side_effect = self.sent.append
        p = mock.patch.object(cs.smtplib, "SMTP", smtp)
        p.start(); self.addCleanup(p.stop)
        self.smtp = smtp
        cs.LIMITER.reset()
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), cs.make_handler(CONFIG))
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.url = f"http://127.0.0.1:{self.server.server_port}/api/contact"

    def post(self, body, ctype, ip="203.0.113.7", path=None, method="POST"):
        req = urllib.request.Request(path or self.url, data=body, method=method,
                                     headers={"Content-Type": ctype, "X-Real-IP": ip})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            with e:
                return e.code, json.loads(e.read())


class Accepts(Base):
    def test_business_inquiry_is_mailed_to_fixed_recipients(self):
        status, body = self.post(*multipart(valid()))
        self.assertEqual((status, body), (200, {"ok": True}))
        self.assertEqual(len(self.sent), 1)
        m = self.sent[0]
        self.assertEqual(m["To"], "administration@umtelkomd.com, ihorstmann@umtelkomd.com")
        self.assertEqual(m["From"], "web@umtelkomd.com")
        self.assertEqual(m["Reply-To"], "erika@example.de")
        self.assertEqual(m["Subject"], "Projektanfrage über umtelkomd.net – Erika Muster")
        text = m.get_body(("plain",)).get_content()
        self.assertIn("Region: Höxter", text)
        self.assertIn("Name: Erika Muster", text)
        self.smtp.return_value.__enter__.return_value.starttls.assert_called_once()
        self.smtp.return_value.__enter__.return_value.login.assert_called_once_with("web@umtelkomd.com", "secret")

    def test_application_with_cv_is_attached(self):
        body, ctype = multipart(valid(form="job"), [("cv", "Lebenslauf.pdf", "application/pdf", PDF)])
        self.assertEqual(self.post(body, ctype), (200, {"ok": True}))
        m = self.sent[0]
        self.assertTrue(m["Subject"].startswith("Bewerbung / Partneranfrage über umtelkomd.net"))
        att = list(m.iter_attachments())
        self.assertEqual([(a.get_filename(), a.get_content()) for a in att], [("Lebenslauf.pdf", PDF)])

    def test_honeypot_pretends_success_but_sends_nothing(self):
        self.assertEqual(self.post(*multipart(valid(website="http://spam"))), (200, {"ok": True}))
        self.assertEqual(self.sent, [])

    def test_smtp_timeout_stays_under_nginx_read_timeout(self):
        self.assertEqual(self.post(*multipart(valid())), (200, {"ok": True}))
        self.smtp.assert_called_once_with("smtp.example.test", 587, timeout=10)

    def test_cv_of_exactly_max_size_is_accepted(self):
        cv = PDF + b"0" * (cs.MAX_CV - len(PDF))
        body, ctype = multipart(valid(form="job"), [("cv", "cv.pdf", "application/pdf", cv)])
        self.assertEqual(self.post(body, ctype), (200, {"ok": True}))
        self.assertEqual([len(a.get_content()) for a in self.sent[0].iter_attachments()], [cs.MAX_CV])


class Rejects(Base):
    def assertRejected(self, result, status, error):
        self.assertEqual(result, (status, {"ok": False, "error": error}))
        self.assertEqual(self.sent, [])

    def test_missing_name(self):
        self.assertRejected(self.post(*multipart(valid(name=" "))), 400, "invalid_name")

    def test_invalid_email(self):
        self.assertRejected(self.post(*multipart(valid(email="nope"))), 400, "invalid_email")

    def test_non_ascii_email(self):
        for addr in ("jörg@example.de", "erika@exämple.de"):
            self.assertRejected(self.post(*multipart(valid(email=addr))), 400, "invalid_email")

    def test_header_injection_in_email(self):
        self.assertRejected(self.post(*multipart(valid(email="a@b.de\r\nBcc: x@evil.test"))), 400, "invalid_email")

    def test_header_injection_in_name(self):
        self.assertRejected(self.post(*multipart(valid(name="Eve\nBcc: x@evil.test"))), 400, "invalid_name")

    def test_unknown_form(self):
        self.assertRejected(self.post(*multipart(valid(form="other"))), 400, "invalid_form")

    def test_summary_too_long(self):
        self.assertRejected(self.post(*multipart(valid(summary="x" * 5001))), 400, "invalid_summary")

    def test_cv_only_on_job_form(self):
        body, ctype = multipart(valid(form="biz"), [("cv", "cv.pdf", "application/pdf", PDF)])
        self.assertRejected(self.post(body, ctype), 400, "invalid_file")

    def test_cv_wrong_type(self):
        body, ctype = multipart(valid(form="job"), [("cv", "cv.exe", "application/pdf", b"MZ\x90\x00")])
        self.assertRejected(self.post(body, ctype), 400, "invalid_file")

    def test_cv_content_not_matching_extension(self):
        body, ctype = multipart(valid(form="job"), [("cv", "cv.pdf", "application/pdf", b"MZ\x90\x00")])
        self.assertRejected(self.post(body, ctype), 400, "invalid_file")

    def test_cv_one_byte_over_max_size(self):
        cv = PDF + b"0" * (cs.MAX_CV + 1 - len(PDF))
        body, ctype = multipart(valid(form="job"), [("cv", "cv.pdf", "application/pdf", cv)])
        self.assertRejected(self.post(body, ctype), 400, "invalid_file")

    def test_body_too_large(self):
        big = PDF + b"0" * (cs.MAX_BODY + 1)
        body, ctype = multipart(valid(form="job"), [("cv", "cv.pdf", "application/pdf", big)])
        self.assertRejected(self.post(body, ctype), 413, "too_large")

    def test_not_multipart(self):
        self.assertRejected(self.post(b"{}", "application/json"), 400, "bad_request")

    def test_wrong_path(self):
        self.assertRejected(self.post(*multipart(valid()), path=self.url + "x"), 404, "not_found")

    def test_rate_limit_per_ip(self):
        for _ in range(cs.RATE_MAX):
            self.assertEqual(self.post(*multipart(valid()))[0], 200)
        self.assertEqual(self.post(*multipart(valid())), (429, {"ok": False, "error": "rate_limited"}))
        self.assertEqual(len(self.sent), cs.RATE_MAX)
        self.assertEqual(self.post(*multipart(valid()), ip="198.51.100.1")[0], 200)

    def test_invalid_requests_do_not_consume_quota(self):
        for _ in range(cs.RATE_MAX + 2):
            self.assertRejected(self.post(*multipart(valid(email="nope"))), 400, "invalid_email")
        for _ in range(cs.RATE_MAX + 2):
            self.assertEqual(self.post(*multipart(valid(website="http://spam"))), (200, {"ok": True}))
        self.assertEqual(self.sent, [])
        for _ in range(cs.RATE_MAX):
            self.assertEqual(self.post(*multipart(valid())), (200, {"ok": True}))
        self.assertEqual(len(self.sent), cs.RATE_MAX)

    def test_exhausted_ip_is_rejected_before_validation(self):
        for _ in range(cs.RATE_MAX):
            self.assertEqual(self.post(*multipart(valid()))[0], 200)
        self.sent.clear()
        self.assertRejected(self.post(*multipart(valid(email="nope"))), 429, "rate_limited")

    def test_busy_when_no_body_slot_is_free(self):
        slots = threading.BoundedSemaphore(cs.MAX_CONCURRENT)
        with mock.patch.object(cs, "BODY_SLOTS", slots):
            for _ in range(cs.MAX_CONCURRENT):
                slots.acquire()
            # Headers announce a body that never arrives: the answer must come without reading it.
            with socket.create_connection(("127.0.0.1", self.server.server_port), timeout=5) as s:
                s.sendall(b"POST /api/contact HTTP/1.1\r\nHost: x\r\nX-Real-IP: 203.0.113.7\r\n"
                          b"Content-Type: multipart/form-data; boundary=b\r\nContent-Length: 1000\r\n\r\n")
                head, body = read_response(s)
            self.assertIn(" 503 ", head.splitlines()[0])
            self.assertIn("Connection: close", head)
            self.assertEqual(json.loads(body), {"ok": False, "error": "busy"})
            self.assertEqual(self.sent, [])
            for _ in range(cs.MAX_CONCURRENT):
                slots.release()
            self.assertEqual(self.post(*multipart(valid())), (200, {"ok": True}))

    def test_body_slots_are_released_after_every_outcome(self):
        slots = threading.BoundedSemaphore(cs.MAX_CONCURRENT)
        with mock.patch.object(cs, "BODY_SLOTS", slots):
            self.post(*multipart(valid()))
            self.post(*multipart(valid(email="nope")))
            self.post(*multipart(valid(website="http://spam")))
            self.post(b"{}", "application/json")
            self.smtp.return_value.__enter__.return_value.send_message.side_effect = OSError("down")
            self.post(*multipart(valid()))
            for _ in range(cs.MAX_CONCURRENT):
                self.assertTrue(slots.acquire(blocking=False))

    def raw(self, request):
        with socket.create_connection(("127.0.0.1", self.server.server_port), timeout=5) as s:
            s.sendall(request.replace(b"Host: x\r\n", b"Host: x\r\nConnection: close\r\n"))
            chunks = []
            while chunk := s.recv(4096):
                chunks.append(chunk)
            return b"".join(chunks).decode()

    def test_negative_content_length_does_not_hang(self):
        resp = self.raw(b"POST /api/contact HTTP/1.1\r\nHost: x\r\nContent-Type: multipart/form-data; boundary=b\r\nContent-Length: -1\r\n\r\n")
        self.assertIn(" 400 ", resp.splitlines()[0])
        self.assertIn('"error": "bad_request"', resp)
        self.assertEqual(self.sent, [])

    def test_non_numeric_content_length(self):
        resp = self.raw(b"POST /api/contact HTTP/1.1\r\nHost: x\r\nContent-Type: multipart/form-data; boundary=b\r\nContent-Length: abc\r\n\r\n")
        self.assertIn(" 400 ", resp.splitlines()[0])
        self.assertEqual(self.sent, [])

    def test_slow_client_is_disconnected(self):
        self.assertEqual(cs.make_handler(CONFIG).timeout, 15)
        with mock.patch.object(self.server.RequestHandlerClass, "timeout", 0.3):
            with socket.create_connection(("127.0.0.1", self.server.server_port), timeout=5) as s:
                s.sendall(b"POST /api/contact HTTP/1.1\r\nHost: x\r\n"
                          b"Content-Type: multipart/form-data; boundary=b\r\nContent-Length: 1000\r\n\r\n--b\r\n")
                start = time.monotonic()
                try:
                    data = s.recv(4096)
                except ConnectionResetError:
                    data = b""
                elapsed = time.monotonic() - start
        self.assertEqual(data, b"")  # closed without an answer
        self.assertLess(elapsed, 3)
        self.assertEqual(self.sent, [])

    def test_smtp_failure_reports_error(self):
        self.smtp.return_value.__enter__.return_value.send_message.side_effect = OSError("down")
        self.assertEqual(self.post(*multipart(valid())), (502, {"ok": False, "error": "send_failed"}))


class RateLimiterMemory(unittest.TestCase):
    def test_expired_keys_are_pruned(self):
        lim = cs.RateLimiter()
        for i in range(50):
            self.assertTrue(lim.allow(f"10.0.0.{i}", now=0))
        self.assertEqual(len(lim), 50)
        self.assertTrue(lim.allow("10.0.1.1", now=cs.RATE_WINDOW + 1))
        self.assertEqual(len(lim), 1)

    def test_tracked_keys_are_capped_dropping_the_oldest(self):
        lim = cs.RateLimiter(max_keys=3)
        for _ in range(cs.RATE_MAX):
            self.assertTrue(lim.allow("a", now=1))
        self.assertFalse(lim.allow("a", now=2))
        lim.allow("b", now=3)
        lim.allow("c", now=4)
        lim.allow("d", now=5)  # full: "a" (least recent) is dropped
        self.assertEqual(len(lim), 3)
        self.assertTrue(lim.allow("a", now=6))
        self.assertEqual(len(lim), 3)

    def test_default_cap(self):
        lim = cs.RateLimiter()
        for i in range(cs.RATE_MAX_KEYS + 100):
            lim.allow(str(i), now=1)
        self.assertEqual(len(lim), cs.RATE_MAX_KEYS)


class ConfigFromEnv(unittest.TestCase):
    def test_missing_password_fails_closed(self):
        with self.assertRaises(SystemExit):
            cs.Config.from_env({"SMTP_USER": "web@umtelkomd.com", "MAIL_TO": "a@umtelkomd.com"})


if __name__ == "__main__":
    unittest.main()
