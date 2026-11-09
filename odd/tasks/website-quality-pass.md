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
- S2 "seguridad" — no inline script or style in the pages, so the CSP can drop `'unsafe-inline'`; `security.txt`; no HTML built from form input with `innerHTML`. Server-side items are in T5.
- S3 "nevegacion" — skip link, `main` landmark, current section marked in the menu, section links update the URL, real 404 page, keyboard and screen-reader support for tabs, chips, services list, carousel and the multi-step form.
- S4 "rapidez" — photos as WebP with small variants and lazy loading, hero image and fonts discoverable early, scripts deferred, endless animations paused when off screen.
- S5 "calidad" — meta description, canonical, Open Graph, structured data, `robots.txt`, `sitemap.xml`, heading order, AA text contrast, reduced-motion handling, a reproducible `dist/` build with a link check.

## Tasks

- T1 S4 inline — WebP photos (`scripts/optimize_photos.py`), responsive `img`, hero as `img` — done d3d0bc1 (files) + 2eb86c3 (markup); 31 photos 10.2 MB → 4.3 MB, 640 px set 1.6 MB
- T2 S2 S5 inline — split CSS/JS out of the page, remove inline styles, head metadata, robots/sitemap/security.txt/404, build script — done 2eb86c3, dc8d162; 0 CSP violations under `script-src 'self'; style-src 'self'` on load, scroll and interaction
- T3 S1 S3 S5 inline — design fixes, navigation and accessibility — done 2eb86c3; checked at 1440, 390 and 320 px
- T4 S4 inline — pause off-screen animations, preload, defer — done 2eb86c3; phone load after full scroll about 2.2 MB, hidden service photos not requested
- T5 S2 S3 S4 needs remote authorization — nginx: gzip for css/js/svg, HTTP/2, cache policy, real 404, www→apex, strict CSP; deploy `dist/` — blocked on user authorization (live nginx file must be read first, see L2)

## Log

- L1 User (2026-11-09): "mejora la pagina web ya esta en servicio pero revisa dejarla muy bien, en todos los aspectos, diseno, seguridad, nevegacion, rapidez calidad, etc"
- L2 Audit (2026-11-09), live server: HTTP/1.1 only; css/js/svg served uncompressed; static cache 1 h; unknown URLs (`/robots.txt`, `/sitemap.xml`, `/.env`, anything) answer 200 with the home page; `www` is not redirected; HTML carries `Cache-Control: no-cache`, which no script in this repository sets, so the live nginx site file has drifted from `contact-service/deploy/apply-umtelkomd-net.sh` and must be read before it is changed.
- L3 Audit, page: 16.6 MB of JPEG photos (largest 790 kB); eight service photos load on phones although hidden; no meta description, canonical or Open Graph; kicker/section numbering kept as approved design.
- L4 Route: all tasks inline (one page, shared files, no parallel units). T2 and T5 touch security headers and deploy (high-risk items 2 and 5): one independent verifier at the end.
- L5 Evidence (2026-11-09): form differential against fc402c1 with identical input, both forms: request fields identical except two intended fixes — a message line starting with `Name: ` or `E-Mail: ` was dropped from the e-mail summary, and message lines leaked into the side summary panel. `contact-service` unittest: 39 tests OK (service untouched).
- L6 Review assessment over fc402c1..dc8d162: risk high (`security.txt` path, build script spawning processes), review due. Risk: item 6 (the page has no automated tests; covered by browser probes and the form differential).
- L7 Independent verifier (2026-11-09) over fc402c1..dc8d162: S2–S5 pass, S1 one blocker — footer e-mail addresses broke mid-word at 981–1187 px because the wrapping rule was not limited to phones. Fixed and rechecked at 320, 390, 768, 1024, 1100 and 1440 px: one line each, no overflow. Advisories taken: the build check now also catches single-quoted `style` and `on*` handlers and removes a partial `dist/` on failure. Advisories left: no `popstate` handling; AA ratios not measured by the verifier; `noindex` on legal pages awaits user confirmation.
