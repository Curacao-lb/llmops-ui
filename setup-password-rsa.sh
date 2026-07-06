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

ensure_private_key_ignored() {
  touch "${API_GITIGNORE}"
  if ! grep -qxF "private.pem" "${API_GITIGNORE}"; then
    printf '\nprivate.pem\n' >>"${API_GITIGNORE}"
  fi
}

sync_public_key_to_ui() {
  mkdir -p "$(dirname -- "${UI_PUBLIC_KEY}")"
  cp "${PUBLIC_KEY}" "${UI_PUBLIC_KEY}"
}

if [[ -e "${PRIVATE_KEY}" && -e "${PUBLIC_KEY}" ]]; then
  if ! openssl pkey -pubin -in "${PUBLIC_KEY}" -noout >/dev/null 2>&1; then
    echo "错误：已有公钥无法被 openssl 解析：${PUBLIC_KEY}" >&2
    exit 1
  fi

  ensure_private_key_ignored
  sync_public_key_to_ui
  echo "检测到后端已有完整密钥，已保留原密钥并同步前端公钥："
  echo "  前端公钥：${UI_PUBLIC_KEY}"
  exit 0
fi

if [[ -e "${PRIVATE_KEY}" || -e "${PUBLIC_KEY}" ]]; then
  echo "错误：后端 RSA 密钥不完整，private.pem 和 public.pem 必须同时存在。" >&2
  echo "请先恢复缺失文件，或备份并删除现有密钥后重新运行。" >&2
  exit 1
fi

# 优先使用调用者已设置的口令，否则自动生成 64 位十六进制随机口令。
if [[ -z "${PRIVATE_KEY_PASSWORD:-}" ]]; then
  PRIVATE_KEY_PASSWORD="$(openssl rand -hex 32)"
fi
export PRIVATE_KEY_PASSWORD

# 先在临时目录生成并验证密钥，全部成功后再更新后端配置。
TEMP_DIR="$(mktemp -d "${API_DIR}/.rsa-setup.XXXXXX")"
ENV_TEMP="${TEMP_DIR}/.env"
TEMP_PRIVATE_KEY="${TEMP_DIR}/private.pem"
TEMP_PUBLIC_KEY="${TEMP_DIR}/public.pem"
trap 'rm -rf "${TEMP_DIR}"' EXIT

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

openssl genrsa \
  -aes256 \
  -passout env:PRIVATE_KEY_PASSWORD \
  -out "${TEMP_PRIVATE_KEY}" \
  2048

openssl rsa \
  -in "${TEMP_PRIVATE_KEY}" \
  -passin env:PRIVATE_KEY_PASSWORD \
  -pubout \
  -out "${TEMP_PUBLIC_KEY}"

chmod 600 "${TEMP_PRIVATE_KEY}"
mv "${TEMP_PRIVATE_KEY}" "${PRIVATE_KEY}"
mv "${TEMP_PUBLIC_KEY}" "${PUBLIC_KEY}"
mv "${ENV_TEMP}" "${API_ENV}"
sync_public_key_to_ui
ensure_private_key_ignored
rm -rf "${TEMP_DIR}"
trap - EXIT

echo "RSA 密钥配置完成："
echo "  后端私钥：${PRIVATE_KEY}"
echo "  后端公钥：${PUBLIC_KEY}"
echo "  前端公钥：${UI_PUBLIC_KEY}"
echo
echo "请重启后端服务，并确保前端使用 src/assets/public.pem 加密密码。"
