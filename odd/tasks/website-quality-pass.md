# Website quality pass

Objective: raise the live site (umtelkomd.net, source `prototype/umtelkomd-v11.html`) in design, security, navigation, speed and quality without changing the approved art direction or copy.
Branch `feat/website-v11` · delivery `ask-on-risk` · checks: headless render at 1440 and 390 px, `python3 scripts/build_site.py` (link check), `cd contact-service && python3 -m unittest`.

## Specs

The user's request names five areas. The acceptance items under each are audit findings (assumptions derived from the audit of 2026-11-09, not user wording).

- S1 "diseno" — visible defects fixed, art direction kept:
  - contact summary card no longer clips the contact person (stray `top:96px`);
  - project carousel aligns with the page grid (snap ignored the rail padding); card body has no dead lower half;
  - hero kicker no longer collides with the headline; nav button has a single word gap;
  - no headline or footer e-mail overflows at 320–390 px; project counter does not wrap;
  - the hero thumbnail no longer promises a film that does not exist.
- S2 "seguridad" — no inline script or style in the pages, so the CSP can drop `'unsafe-inline'`; `security.txt`; no HTML built from form input with `innerHTML`. Server-side items are in T6.
- S3 "nevegacion" — skip link, `main` landmark, current section marked in the menu, section links update the URL, real 404 page, keyboard and screen-reader support for tabs, chips, services list, carousel and the multi-step form.
- S4 "rapidez" — photos as WebP with small variants and lazy loading, hero image and fonts discoverable early, scripts deferred, endless animations paused when off screen.
- S5 "calidad" — meta description, canonical, Open Graph, structured data, `robots.txt`, `sitemap.xml`, heading order, AA text contrast, reduced-motion handling, a reproducible `dist/` build with a link check.

## Tasks

- T1 S4 inline — WebP photos (`scripts/optimize_photos.py`), responsive `img`, hero as `img` — pending
- T2 S2 S5 inline — split CSS/JS out of the page, remove inline styles, head metadata, robots/sitemap/security.txt/404, build script — pending
- T3 S1 S3 S5 inline — design fixes, navigation and accessibility — pending
- T4 S4 inline — pause off-screen animations, preload, defer — pending
- T5 S2 S3 S4 needs remote authorization — nginx: gzip for css/js/svg, HTTP/2, cache policy, real 404, www→apex, strict CSP; deploy `dist/` — blocked on user authorization

## Log

- L1 User (2026-11-09): "mejora la pagina web ya esta en servicio pero revisa dejarla muy bien, en todos los aspectos, diseno, seguridad, nevegacion, rapidez calidad, etc"
- L2 Audit (2026-11-09), live server: HTTP/1.1 only; css/js/svg served uncompressed; static cache 1 h; unknown URLs (`/robots.txt`, `/sitemap.xml`, `/.env`, anything) answer 200 with the home page; `www` is not redirected; HTML carries `Cache-Control: no-cache`, which no script in this repository sets, so the live nginx site file has drifted from `contact-service/deploy/apply-umtelkomd-net.sh` and must be read before it is changed.
- L3 Audit, page: 16.6 MB of JPEG photos (largest 790 kB); eight service photos load on phones although hidden; no meta description, canonical or Open Graph; kicker/section numbering kept as approved design.
- L4 Route: all tasks inline (one page, shared files, no parallel units). T2 and T5 touch security headers and deploy (high-risk items 2 and 5): one independent verifier at the end.
