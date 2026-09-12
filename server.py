#!/usr/bin/env python3
"""Serve the local paper-memory app with correct MIME types for ES modules."""
from __future__ import annotations

import functools
import os
import socketserver
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write("[paper-memory] " + fmt % args + "\n")


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def pick_server() -> ReusableThreadingHTTPServer:
    handler = functools.partial(Handler, directory=str(ROOT))
    for port in (8765, 8766, 8767, 0):
        try:
            return ReusableThreadingHTTPServer(("127.0.0.1", port), handler)
        except OSError:
            continue
    raise RuntimeError("无法找到可用端口")


def main() -> None:
    server = pick_server()
    host, port = server.server_address
    open_path = os.environ.get("PAPER_MEMORY_OPEN_PATH", "").lstrip("/")
    url = f"http://{host}:{port}/{open_path}"
    print(f"文脉 · 论文记忆助手已启动：{url}")
    print("按 Ctrl+C 停止。论文数据保存在浏览器 IndexedDB 中。")
    if os.environ.get("PAPER_MEMORY_NO_BROWSER") != "1":
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
