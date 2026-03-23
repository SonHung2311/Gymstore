from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/og-preview", tags=["og-preview"])

YOUTUBE_RE = (
    "youtube.com/watch",
    "youtube.com/shorts",
    "youtu.be/",
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    )
}


class OgParser(HTMLParser):
    """Minimal parser that extracts <meta property="og:*"> and <title> tags."""

    def __init__(self):
        super().__init__()
        self.og: dict[str, str] = {}
        self._in_title = False
        self._title_text = ""

    def handle_starttag(self, tag: str, attrs):
        if tag == "title":
            self._in_title = True
            return
        if tag != "meta":
            return
        props = dict(attrs)
        prop = props.get("property", "") or props.get("name", "")
        content = props.get("content", "")
        if prop.startswith("og:") and content:
            self.og[prop[3:]] = content

    def handle_data(self, data: str):
        if self._in_title:
            self._title_text += data

    def handle_endtag(self, tag: str):
        if tag == "title":
            self._in_title = False


def _favicon_url(url: str) -> str:
    domain = urlparse(url).netloc
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"


@router.get("")
async def og_preview(url: str = Query(...)):
    domain = urlparse(url).netloc or url

    # YouTube oEmbed (no API key needed)
    if any(p in url for p in YOUTUBE_RE):
        try:
            async with httpx.AsyncClient(timeout=6) as client:
                r = await client.get(
                    "https://www.youtube.com/oembed",
                    params={"url": url, "format": "json"},
                )
                if r.status_code == 200:
                    d = r.json()
                    return {
                        "title": d.get("title"),
                        "image": d.get("thumbnail_url"),
                        "description": None,
                        "site_name": d.get("provider_name", "YouTube"),
                        "url": url,
                        "favicon": _favicon_url(url),
                    }
        except Exception:
            pass

    # Generic OG meta tag parsing
    try:
        async with httpx.AsyncClient(
            timeout=6, follow_redirects=True, headers=HEADERS
        ) as client:
            r = await client.get(url)
            if r.status_code >= 400:
                # Site blocked or doesn't exist — return domain fallback
                return JSONResponse({
                    "title": domain,
                    "image": None,
                    "description": None,
                    "site_name": domain,
                    "url": url,
                    "favicon": _favicon_url(url),
                })
            parser = OgParser()
            # Parse only first 50 KB to avoid large pages
            parser.feed(r.text[:51200])
            og = parser.og
            # Prefer og:title, fall back to <title> only if it looks meaningful
            raw_title = parser._title_text.strip()
            is_generic = any(
                kw in raw_title.lower()
                for kw in ("page not found", "404", "error", "access denied", "just a moment")
            )
            title = og.get("title") or (None if is_generic else raw_title) or domain
            return {
                "title": title or None,
                "image": og.get("image") or None,
                "description": og.get("description") or None,
                "site_name": og.get("site_name") or domain,
                "url": url,
                "favicon": _favicon_url(url),
            }
    except Exception:
        pass

    # Fallback — just return domain info
    return JSONResponse({
        "title": domain,
        "image": None,
        "description": None,
        "site_name": domain,
        "url": url,
        "favicon": _favicon_url(url),
    })
