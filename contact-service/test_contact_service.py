"""Tests for the contact form relay. Run: python3 -m unittest -v (from contact-service/)."""
import io
import json
import threading
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


class Rejects(Base):
    def assertRejected(self, result, status, error):
        self.assertEqual(result, (status, {"ok": False, "error": error}))
        self.assertEqual(self.sent, [])

    def test_missing_name(self):
        self.assertRejected(self.post(*multipart(valid(name=" "))), 400, "invalid_name")

    def test_invalid_email(self):
        self.assertRejected(self.post(*multipart(valid(email="nope"))), 400, "invalid_email")

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

    def raw(self, request):
        import socket
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

    def test_slow_client_times_out(self):
        self.assertLessEqual(cs.make_handler(CONFIG).timeout, 30)

    def test_smtp_failure_reports_error(self):
        self.smtp.return_value.__enter__.return_value.send_message.side_effect = OSError("down")
        self.assertEqual(self.post(*multipart(valid())), (502, {"ok": False, "error": "send_failed"}))


class ConfigFromEnv(unittest.TestCase):
    def test_missing_password_fails_closed(self):
        with self.assertRaises(SystemExit):
            cs.Config.from_env({"SMTP_USER": "web@umtelkomd.com", "MAIL_TO": "a@umtelkomd.com"})


if __name__ == "__main__":
    unittest.main()
