# UMTELKOMD website redesign — handoff (2026-11-06)

## Current version
`umtelkomd-v11.html` (opens by double-click) with its stylesheet `assets/site.css` and script `assets/site.js`. Other assets in `assets/`. Older versions v1–v10 are kept for history only.

The page carries no inline script or style, so the server's Content-Security-Policy does not need `'unsafe-inline'`. Keep it that way: `scripts/build_site.py` fails if inline code comes back.

## Build and deploy
- `python3 scripts/optimize_photos.py` — after adding or replacing a photo: writes `<name>.webp` (max. 1200 px) and `<name>-640.webp` next to the JPEG master. The pages reference only the WebP files.
- `python3 scripts/build_site.py` — writes `dist/` (not in git): `index.html`, legal pages, `404.html`, `robots.txt`, `sitemap.xml`, `.well-known/security.txt` and only the assets the pages reference, with content-hashed CSS/JS URLs. It fails on a broken reference.
- Deploy the contents of `dist/` to `/var/www/landing`.

Style is based on the user's references: metriccivil.ca (awwwards.com/sites/metric) and sts-hydro.com. The site is photo-led, with big Cinzel display type, a cream/deep-teal palette, GSAP 3.13, SplitText and Lenis.

Sections, in page order:
- Hero: excavator photo from Aue-Bad Schlema, plus the original site's light pulse riding a wave.
- Unser Standard.
- In Zahlen.
- Photo marquee.
- Leistungen: hover swaps the image.
- Ablauf: 8 steps on a fiber line.
- Projekte: 7 cards.
- Karriere.
- Kontakt: two forms.
- Footer.

## Decisions taken with the user
- **Numbers**: totals only, never per project. The figures shown are `330+ km`, `13.000+ WE`, `10.000+ Gebäude` and `4.000+ Aktivierungen`, with the caption "Seit 2021 im Glasfaserausbau."
  - Method: the 2026 figures from Nodo, multiplied by 2 and rounded down.
  - Source data (Nodo DB, 2026 only): 167,847 m blown, 6,664 dwelling units, 5,058 buildings, 2,021 activations.
  - The user explicitly asked to remove the "Hochrechnung" disclaimer.
- **Projects**: Aue-Bad Schlema (Telekom, Tiefbau FTTH), Kinzigtal (Hausach/Mühlenbach), Höxter (tag "Hausanschluss" only, never "NE4 Hausanschluss"), Harsewinkel, Groß-Zimmern, Roßdorf and Reinheim. There is no separate "Telekom NE4" card, because AUE is the Telekom project.
- **Contact e-mails**: administration@umtelkomd.com and ihorstmann@umtelkomd.com.
- **Company address**: removed from the visible site at the user's request.

## Photo sources
All photos are cropped (GPS/address stamps removed) and given a brand duotone with `~/Umtelkomd/scripts/duotone_list.py`.
- `aue-*`: extracted with `pdfimages` from the Drive PDF "Ausfuehrungsbericht_NVt_2V9013_Aue-Bad_Schlema" (folder AUE).
- `hxc-*`: Drive images named `*_hausanschluss_*.jpg` (GPS Höxter).
- `civil-*`: `~/Documents/Reestructura_UMTELKOMD/NAS_UGG_whatsapp_*` (GPS Hausach/Mühlenbach).
- `ne4-*`: ne4-work-manager backup photos (Harsewinkel, westconnect).
- `hx-*`: `~/Downloads/Hoxter_soplado_montajes_2026-10-16`.
- `field-*`: `~/Documents/UMTELKOMD/Fotos_Reparaciones_Slack_2026-10-12`.

## Open before publishing
1. ~~Impressum and Datenschutzerklärung~~ — done: `impressum.html`, `datenschutz.html`, `assets/legal.css`, linked from the v11 footer only. Data: HR-Auszug 2022-11-02 + invoices 2026 (Drive Agenda) confirm address; USt-IdNr DE342168532. No phone, birth date or shareholders (user wants minimal data).
   - Fonts (latin + latin-ext) self-hosted in `assets/fonts/` via `assets/fonts.css`; GSAP 3.13 + Lenis 1.1.13 in `assets/vendor/`. v11 makes zero third-party requests (verified in headless Chromium).
2. ~~Remove the "Foto-Platzhalter · Shooting" labels~~ — done in v11 (`.ph-slot` class kept as a marker, no visible label).
3. ~~Forms via `mailto:`~~ — done: `contact-service/` (Python stdlib relay, 127.0.0.1:8787 behind nginx `POST /api/contact`, fixed recipients, honeypot, rate limit, CV upload ≤5 MB with type check, stores nothing). v11 posts to it and falls back to `mailto:` on `file:` or server error. Deploy files in `contact-service/deploy/`; needs a Google Workspace sending account + app password in `/etc/contact-service.env`. Tests: `cd contact-service && python3 -m unittest`.
4. Deployment: umtelkomd.net points to 72.60.123.94 (nginx/Ubuntu). There is no SSH access configured on this Mac. The deploy replaces the old React site (ES/EN versions, map, intranet).
5. Optional: full name and photo for the "I. Horstmann" contact card, the "NAH" project details, and a professional photo/drone shoot.

## Related brand work (same session)
- Email signature: `~/Documents/Sistema de marca Umtelkomd/applications/email/umtelkomd-signature-v2.html`.
- Brand refresh 1.1: `~/Documents/Sistema de marca Umtelkomd/UMTELKOMD Brand Refresh 2026.html` (cream `#FDFBF6` for digital documents).
- Step 3 (logo adjustments) is still pending.
