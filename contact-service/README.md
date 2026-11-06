# contact-service

Relays the website's contact and application forms to the company inbox by e-mail.

- Standard library only (Python 3.10+), no `pip install`.
- Listens on `127.0.0.1` only; nginx forwards `POST /api/contact` to it.
- Stores nothing: each request is validated, sent by SMTP and discarded. Logs contain method, path and status only, never form data.
- Recipients are fixed in configuration. The browser cannot choose where mail goes, so the form cannot be abused as an open relay.

## What it accepts

`multipart/form-data` with these fields:

| Field | Rule |
| --- | --- |
| `form` | `biz` (project inquiry) or `job` (application / subcontractor) |
| `name` | required, at most 120 characters, no control characters |
| `email` | required, valid address, used as `Reply-To` |
| `summary` | optional text, at most 5000 characters |
| `website` | honeypot; if filled the request is answered `ok` and dropped |
| `cv` | `job` only, optional; PDF, DOC, DOCX, JPG or PNG, at most 5 MB, content must match the extension |

Responses are JSON: `{"ok": true}` or `{"ok": false, "error": "<code>"}`.

| Status | `error` |
| --- | --- |
| 400 | `bad_request`, `invalid_form`, `invalid_name`, `invalid_email`, `invalid_summary`, `invalid_file` |
| 404 | `not_found` |
| 413 | `too_large` (request body over 6 MB) |
| 429 | `rate_limited` (more than 5 requests per IP in 10 minutes) |
| 502 | `send_failed` (SMTP error; the website then falls back to `mailto:`) |

## Configuration (environment)

| Variable | Default | Meaning |
| --- | --- | --- |
| `SMTP_USER` | required | Sending account, e.g. a Google Workspace user |
| `SMTP_PASSWORD` | required | App password of that account |
| `MAIL_TO` | required | Comma-separated recipients |
| `SMTP_HOST` | `smtp.gmail.com` | |
| `SMTP_PORT` | `587` | STARTTLS |
| `MAIL_FROM` | `SMTP_USER` | |
| `PORT` | `8787` | Local port |

The service exits at start if a required variable is missing.

## Deploy (Ubuntu + nginx)

```sh
sudo useradd --system --no-create-home contact
sudo install -d -o root -g root /opt/contact-service
sudo install -m 644 contact_service.py /opt/contact-service/
sudo install -m 600 -o root -g root contact.env.example /etc/contact-service.env   # then edit it
sudo install -m 644 deploy/contact-service.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now contact-service
```

Add `deploy/nginx-contact.conf` inside the site's `server { }` block, then `sudo nginx -t && sudo systemctl reload nginx`.

nginx **must** overwrite `X-Real-IP` with `$remote_addr` (the snippet does); the rate limit trusts that header.

## Tests

```sh
python3 -m unittest -v
```

SMTP is mocked; no mail is sent.
