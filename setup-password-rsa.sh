#!/usr/bin/env bash

set -euo pipefail

UI_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${LLMOPS_API_DIR:-"${UI_DIR}/../llmops-api"}"
API_ENV="${API_DIR}/.env"
API_GITIGNORE="${API_DIR}/.gitignore"
PRIVATE_KEY="${API_DIR}/private.pem"
PUBLIC_KEY="${API_DIR}/public.pem"
UI_PUBLIC_KEY="${UI_DIR}/src/assets/public.pem"

if ! command -v openssl >/dev/null 2>&1; then
  echo "错误：未找到 openssl，请先安装。" >&2
  exit 1
fi

if [[ ! -d "${API_DIR}" || ! -f "${API_ENV}" ]]; then
  echo "错误：未找到后端目录或 .env：${API_DIR}" >&2
  echo "可以通过 LLMOPS_API_DIR 指定后端目录。" >&2
  exit 1
fi

if [[ -e "${PRIVATE_KEY}" || -e "${PUBLIC_KEY}" ]]; then
  echo "错误：后端已经存在 private.pem 或 public.pem，脚本不会覆盖已有密钥。" >&2
  echo "如需重新生成，请先备份并手动删除这两个文件。" >&2
  exit 1
fi

# 优先使用调用者已设置的口令，否则自动生成 64 位十六进制随机口令。
if [[ -z "${PRIVATE_KEY_PASSWORD:-}" ]]; then
  PRIVATE_KEY_PASSWORD="$(openssl rand -hex 32)"
fi
export PRIVATE_KEY_PASSWORD

# 将口令写入后端 .env；已存在时替换，避免出现重复配置。
ENV_TEMP="$(mktemp)"
trap 'rm -f "${ENV_TEMP}"' EXIT

awk -v value="${PRIVATE_KEY_PASSWORD}" '
  BEGIN { replaced = 0 }
  /^PRIVATE_KEY_PASSWORD=/ {
    if (!replaced) {
      print "PRIVATE_KEY_PASSWORD=" value
      replaced = 1
    }
    next
  }
  { print }
  END {
    if (!replaced) {
      print "PRIVATE_KEY_PASSWORD=" value
    }
  }
' "${API_ENV}" >"${ENV_TEMP}"
mv "${ENV_TEMP}" "${API_ENV}"
trap - EXIT

openssl genrsa \
  -aes256 \
  -passout env:PRIVATE_KEY_PASSWORD \
  -out "${PRIVATE_KEY}" \
  2048

openssl rsa \
  -in "${PRIVATE_KEY}" \
  -passin env:PRIVATE_KEY_PASSWORD \
  -pubout \
  -out "${PUBLIC_KEY}"

chmod 600 "${PRIVATE_KEY}"
mkdir -p "$(dirname -- "${UI_PUBLIC_KEY}")"
cp "${PUBLIC_KEY}" "${UI_PUBLIC_KEY}"

touch "${API_GITIGNORE}"
if ! grep -qxF "private.pem" "${API_GITIGNORE}"; then
  printf '\nprivate.pem\n' >>"${API_GITIGNORE}"
fi

echo "RSA 密钥配置完成："
echo "  后端私钥：${PRIVATE_KEY}"
echo "  后端公钥：${PUBLIC_KEY}"
echo "  前端公钥：${UI_PUBLIC_KEY}"
echo
echo "请重启后端服务，并确保前端使用 src/assets/public.pem 加密密码。"
