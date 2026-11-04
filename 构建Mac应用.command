#!/bin/bash
# Finder 双击或从任何目录运行，均以本文件所在目录作为项目根目录。
set -u
pause() {
  if [ -t 0 ]; then
    printf '\n按回车关闭此窗口……'
    IFS= read -r answer
  fi
}
fail() { printf '\n%s\n' "$1" >&2; pause; exit 1; }
cd "$(dirname "$0")" || fail '无法进入脚本所在文件夹。请先完整解压源码包。'
printf '个人订阅日历 · Mac 构建助手\n项目目录：%s\n' "$PWD"
[ -f package.json ] && [ -f package-lock.json ] || fail '源码不完整：缺少 package.json 或 package-lock.json。请下载 source 源码包并完整解压，不要把此脚本单独移走。'
command -v node >/dev/null 2>&1 || fail '未找到 Node.js。请从 https://nodejs.org/ 安装 Node.js 24，再关闭并重新打开终端。'
command -v npm >/dev/null 2>&1 || fail '未找到 npm，请重新安装包含 npm 的 Node.js 24。'
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<22||(a===22&&b<12))process.exit(1);if(require("./package.json").name!=="phycalendar")process.exit(1)' || fail '需要 Node.js 22.12 或以上（建议 24），且脚本必须位于 PhyCalendar 项目中。'
if [ "${1:-}" = '--check-only' ]; then
  printf '检查通过：已自动进入项目目录，项目文件和 Node/npm 可用。未安装依赖、未执行构建。\n'
  exit 0
fi
[ "$(uname -s)" = 'Darwin' ] || fail '独立 Mac App 需要在 macOS 上构建。本脚本不会把其他系统的产物冒充 Mac 安装包。'
printf '\n正在安装锁定依赖。首次需要联网，可能需要几分钟。\n'
npm ci
result=$?
if [ "$result" -ne 0 ]; then
  printf '\n依赖安装失败（退出码 %s），已停止，没有继续构建。请保留上面的错误信息。\n' "$result" >&2
  pause
  exit "$result"
fi
printf '\n正在构建独立 Mac App……\n'
npm run dist:mac
result=$?
if [ "$result" -ne 0 ]; then
  printf '\n构建失败（退出码 %s）。请保留上面的错误信息。\n' "$result" >&2
  pause
  exit "$result"
fi
printf '\n构建完成。文件位于：%s/release\nApple 芯片选择 arm64，Intel 选择 x64。此版本没有 Developer ID 公证。\n' "$PWD"
open "$PWD/release"
pause
