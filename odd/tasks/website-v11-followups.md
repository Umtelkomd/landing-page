# Website v11 follow-ups

Post-launch work on umtelkomd.net (v11 live since 2026-11-07, branch feat/website-v11).
Server 72.60.123.94 is shared with the ERP, Nodo and databases: no change may affect them.

## Specs

- S1 "Icono de pestaña (favicon)." The site serves a favicon; /favicon.ico no longer returns 404.
- S2 "Opcional: menú en móvil." On narrow screens the section links (Leistungen, Ablauf, Projekte, Karriere) are reachable through a menu.
- S3 "Redirigir umtelkomd.com a umtelkomd.net. Hoy la `.com` no lleva a ningún sitio." umtelkomd.com and www.umtelkomd.com redirect to https://umtelkomd.net over HTTPS. Mail for @umtelkomd.com must keep working.
- S4 "Actualizar Ubuntu. La 25.04 ya no recibe parches de seguridad." Server on a supported Ubuntu release, without breaking ERP, Nodo, databases or other sites; snapshot and rollback path first.
- S5 "Subir la rama `feat/website-v11` a GitHub."

## Tasks

- T1 S1 inline — favicon in site + deploy — done c305851, live (/favicon.ico 200)
- T2 S2 inline — mobile menu + deploy — done c305851, live; checked 344px open/close/link, desktop unchanged
- T3 S5 inline — push branch — done, origin/feat/website-v11
- T4 S3 user DNS + inline nginx/cert — .com redirect — done d53b22e; http+https, apex+www → 301 https://umtelkomd.net (path kept); MX untouched; cert expires 2027-02-05
- T5 S4 plan first, user approval per step — Ubuntu upgrade — plan written: odd/plans/ubuntu-26.04-upgrade.md; EXECUTED 2026-11-07, see plan "Execution log"

## Log

- L1 User (2026-11-07), answering "¿Con cuál seguimos?" over the list (Ubuntu, .com redirect, favicon, mobile menu, push): "todas"
- L2 User (2026-11-07), on the upgrade window: "si los sabados por la manana" → proposed Saturday 2026-11-14, 08:00–10:00 (to confirm)
