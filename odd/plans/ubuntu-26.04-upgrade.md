# Plan: upgrade 72.60.123.94 from Ubuntu 25.04 to 26.04 LTS

Status: draft for review. Nothing in this plan has been executed.

## Why

Ubuntu 25.04 (plucky) reached end of life in January 2026 and receives no security updates.
`do-release-upgrade -c` on the server offers **26.04.1 LTS** directly; it is supported until 2031.

## What runs on the server (inventory 2026-11-07)

| Service | How it runs | Upgrade risk |
| --- | --- | --- |
| ERP prod + staging (frontend, backend, queues, websocket, scheduler) | Docker | Low: containers keep their own OS; Docker comes from Docker's own apt repo |
| ERP databases (MariaDB 11.8, Redis) | Docker | Low |
| Nodo prod + staging + Postgres 17 | Docker | Low |
| engram-cloud + Postgres 16 | Docker | Low |
| MySQL 8.4 | host package | Medium: same 8.4 LTS series expected; data dir must survive the package upgrade |
| PostgreSQL 17 | host package | **High**: 26.04 may ship a newer major version. The old cluster keeps running on 17, but must not be dropped by accident |
| pm2 app `alendro` (Next.js on :3000) | host Node + pm2 | Medium: Node version may change; pm2 startup unit must come back |
| nginx (all sites, Let's Encrypt) | host package | Medium: config is kept; certbot renewal timer must still work |
| rclone mount, Tailscale, fail2ban, contact-service | host | Low |

## Before (one evening, no downtime)

1. Agree a maintenance window (suggested: weekend night, ~2 h) and tell the ERP users.
2. Hostinger snapshot (the panel keeps only one: it replaces the one from 2026-11-07).
3. Logical database dumps, copied off the server:
   - host MySQL: `mysqldump --all-databases --single-transaction --routines --events`
   - host PostgreSQL 17: `pg_dumpall`
   - Docker databases: `mariadb-dump` for ERP prod/staging, `pg_dumpall` for Nodo prod/staging and engram.
4. Save `/etc` (tar), the crontabs, `pm2 save`, and the list of installed packages.
5. Record a baseline: HTTP status of every site, `docker ps`, `systemctl --failed`, open ports.
6. Bring 25.04 fully up to date and reboot once, so the upgrade starts from a clean state.

## During the window

1. Stop writers: ERP and Nodo containers (`docker compose stop`), pm2 app.
2. `do-release-upgrade` inside `tmux` (survives a dropped SSH session). Keep existing config files when asked (nginx, ssh, fail2ban, our hardening).
3. Reboot.
4. Check PostgreSQL: `pg_lsclusters`. If a new major version was installed, keep the 17 cluster as the active one; migrate to the new major later in a separate step.
5. Start containers and pm2; run the checks below.

## Checks after the upgrade

- `lsb_release -ds` shows 26.04.
- Every site returns the same HTTP status as the baseline (umtelkomd.net, app., fotos., utassets., dev.utassets., demobot.).
- `docker ps` lists all containers healthy; ERP and Nodo log in and show data.
- MySQL and PostgreSQL answer and list the same databases.
- contact form: `POST /api/contact` with invalid data returns 400 (no mail sent).
- `systemctl --failed` is empty; `certbot renew --dry-run` passes; fail2ban jail active; SSH key login works and password login is still refused.

## Rollback

- Small problem (one service): fix in place using the saved configs.
- Server does not boot or several services fail: restore the Hostinger snapshot.
  Anything written after the snapshot is lost, which is why writers are stopped during the window.

## Open decisions for the user

- Maintenance window date/time and who informs the ERP users.
- Who owns the `alendro` app (pm2) and can test it afterwards.
