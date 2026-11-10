#!/usr/bin/env python3
"""Build the deployable site into dist/ from prototype/.

- umtelkomd-v11.html becomes index.html; links to it become "/".
- Only files the pages actually reference are copied (no old prototypes, no JPEG masters).
- Stylesheet and script URLs get a content hash (?v=...), so they can be cached for a long time.
- Fails when a reference does not resolve, or when a page carries inline script or style
  (the server's Content-Security-Policy allows neither).

Usage: python3 scripts/build_site.py   (then deploy the contents of dist/)
"""
import hashlib
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "prototype", ROOT / "dist"
PAGES = {"umtelkomd-v11.html": "index.html", "impressum.html": "impressum.html",
         "datenschutz.html": "datenschutz.html", "404.html": "404.html"}
EXTRA = ["service-worker.js", "sw.js", "favicon.ico", "robots.txt", "sitemap.xml", ".well-known/security.txt", "assets/og.jpg"]
HOME = "umtelkomd-v11.html"

ATTR = re.compile(r'(?:href|src)="([^"]+)"')
SRCSET = re.compile(r'srcset="([^"]+)"')
CSS_URL = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)')
INLINE_SCRIPT = re.compile(r"<script(?![^>]*\bsrc=)(?![^>]*application/ld\+json)[^>]*>", re.I)
INLINE_STYLE = re.compile(r"<style\b|\s(?:style|on[a-z]+)\s*=", re.I)  # style attributes and on* handlers, any quoting
errors = []


def is_local(ref: str) -> bool:
    return not re.match(r"(?:[a-z][a-z0-9+.-]*:|#|//)", ref, re.I)


def resolve(ref: str, base: Path) -> Path:
    """Source file a reference points to; absolute paths are relative to the site root."""
    path = ref.split("#")[0].split("?")[0]
    return (SRC / path.lstrip("/")) if path.startswith("/") else (base / path)


def copy(src: Path) -> None:
    dst = OUT / src.relative_to(SRC)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def take(ref: str, base: Path, origin: str, seen: set) -> None:
    src = resolve(ref, base).resolve()
    if src in seen:
        return
    seen.add(src)
    if not src.is_file() or SRC.resolve() not in src.parents:
        errors.append(f"{origin}: missing {ref}")
        return
    copy(src)
    if src.suffix == ".css":  # fonts and background photos
        for url in CSS_URL.findall(src.read_text(encoding="utf-8")):
            if is_local(url):
                take(url, src.parent, src.name, seen)


def stamp(html: str, page: str) -> str:
    def versioned(match):
        ref = match.group(1)
        if not is_local(ref) or not ref.split("?")[0].endswith((".css", ".js")):
            return match.group(0)
        src = resolve(ref, SRC)
        if not src.is_file():
            return match.group(0)  # reported by take()
        digest = hashlib.sha1(src.read_bytes()).hexdigest()[:10]
        return match.group(0).replace(ref, f"{ref}?v={digest}")
    return ATTR.sub(versioned, html)


def main() -> int:
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    seen: set = set()
    for name, target in PAGES.items():
        html = (SRC / name).read_text(encoding="utf-8")
        if INLINE_SCRIPT.search(html) or INLINE_STYLE.search(html):
            errors.append(f"{name}: inline script, style or event handler (blocked by the Content-Security-Policy)")
        refs = ATTR.findall(html) + [c.split()[0] for s in SRCSET.findall(html) for c in s.split(",")]
        for ref in refs:
            path = ref.split("#")[0].split("?")[0]
            if not is_local(ref) or path in ("", "/"):
                continue
            if path.lstrip("/") in PAGES:
                continue
            take(ref, SRC, name, seen)
        html = html.replace(f'href="{HOME}"', 'href="/"')
        (OUT / target).write_text(stamp(html, name), encoding="utf-8")
    for extra in EXTRA:
        take(extra, SRC, "extra files", seen)
    if errors:
        shutil.rmtree(OUT, ignore_errors=True)  # never leave a partial build that could be deployed
        print("\n".join(errors), file=sys.stderr)
        return 1
    files = [f for f in OUT.rglob("*") if f.is_file()]
    print(f"dist/: {len(files)} files, {sum(f.stat().st_size for f in files) / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
