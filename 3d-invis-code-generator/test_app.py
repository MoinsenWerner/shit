import socket
import unittest
from unittest.mock import patch

import app


class AppTests(unittest.TestCase):
    def test_built_app_is_available(self) -> None:
        app.ensure_built_app()

    def test_server_uses_an_available_port(self) -> None:
        server = app.create_server(0)
        self.addCleanup(server.server_close)
        self.assertGreater(server.server_port, 0)

    def test_fallback_port_is_used_when_preferred_port_is_busy(self) -> None:
        with socket.socket() as blocker:
            blocker.bind(("127.0.0.1", 0))
            blocker.listen()
            occupied_port = blocker.getsockname()[1]
            server = app.create_server(occupied_port)
        self.addCleanup(server.server_close)
        self.assertNotEqual(server.server_port, occupied_port)
        self.assertGreater(server.server_port, 0)

    def test_missing_build_exits_with_helpful_message(self) -> None:
        with patch.object(app, "SITE_DIR", app.PROJECT_DIR / "nicht-vorhanden"):
            with self.assertRaisesRegex(SystemExit, "npm install"):
                app.ensure_built_app()


if __name__ == "__main__":
    unittest.main()
