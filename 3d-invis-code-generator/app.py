"""Lokaler, abhängigkeitenfreier Webserver für den 3D-Code-Generator."""

from __future__ import annotations

import argparse
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent
SITE_DIR = PROJECT_DIR / "dist"


class AppRequestHandler(SimpleHTTPRequestHandler):
    """Liefert den gebauten Generator aus und unterstützt Browser-Fallbacks."""

    def __init__(self, *args: object, **kwargs: object) -> None:
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def do_GET(self) -> None:  # noqa: N802 - Name wird von http.server vorgegeben.
        requested_file = SITE_DIR / self.path.lstrip("/").split("?", 1)[0]
        if self.path != "/" and not requested_file.is_file():
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, message_format: str, *args: object) -> None:
        print(f"[SUBMARK] {self.address_string()} - {message_format % args}")


def create_server(preferred_port: int) -> ThreadingHTTPServer:
    """Bindet den Wunsch-Port oder lässt das Betriebssystem einen freien wählen."""
    try:
        return ThreadingHTTPServer(("127.0.0.1", preferred_port), AppRequestHandler)
    except OSError:
        return ThreadingHTTPServer(("127.0.0.1", 0), AppRequestHandler)


def ensure_built_app() -> None:
    """Gibt eine hilfreiche Meldung aus, falls die Webdateien fehlen."""
    if not (SITE_DIR / "index.html").is_file():
        raise SystemExit(
            "Die Web-App fehlt. Bitte das vollständige Projekt erneut herunterladen "
            "oder einmal 'npm install && npm run build' ausführen."
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SUBMARK lokal unter Windows starten")
    parser.add_argument("--port", type=int, default=8000, help="gewünschter Port (Standard: 8000)")
    parser.add_argument("--no-browser", action="store_true", help="Browser nicht automatisch öffnen")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_built_app()
    server = create_server(args.port)
    port = server.server_port
    url = f"http://127.0.0.1:{port}"

    print("\nSUBMARK 3D-Code-Generator")
    print(f"Geöffnet unter: {url}")
    print("Zum Beenden Strg+C drücken.\n")
    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
