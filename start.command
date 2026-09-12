#!/bin/zsh
set -e
cd "$(dirname "$0")"

DEMO_PATH="guided-demo.html?autoplay=1"
DEMO_URL="http://127.0.0.1:8765/${DEMO_PATH}"

if curl -fsS "http://127.0.0.1:8765/" >/dev/null 2>&1; then
  echo "论文助手服务器已经在运行，正在打开自动演示。"
  open "$DEMO_URL"
  exit 0
fi

PYTHON_BIN="/Users/chenxiping/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
if [ ! -x "$PYTHON_BIN" ]; then
  PYTHON_BIN="$(command -v python3 || true)"
fi

if [ -z "$PYTHON_BIN" ] || [ ! -x "$PYTHON_BIN" ]; then
  echo "没有找到可用的 Python 3。请先安装 Python，或在终端运行本地静态服务器。"
  read -r "?按回车退出..."
  exit 1
fi

export PAPER_MEMORY_OPEN_PATH="$DEMO_PATH"
echo "正在启动论文助手，并打开自动演示。"
echo "请保持此窗口打开；关闭窗口后本地服务会停止。"
exec "$PYTHON_BIN" server.py
