#!/usr/bin/env bash
# Deploy Beratheon Clarity contracts to Stacks testnet.
# Requires backend/.env with STACKS_MNEMONIC (24 words).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/../backend/.env"
TESTNET_TOML="$ROOT/settings/Testnet.toml"

export PATH="$ROOT/../.bin:$PATH"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy backend/.env.example and add STACKS_MNEMONIC"
  exit 1
fi

STACKS_MNEMONIC="$(grep -E '^STACKS_MNEMONIC=' "$ENV_FILE" | cut -d= -f2- | sed 's/^["'\'' ]*//; s/["'\'' ]*$//' | xargs)"

if [[ -z "${STACKS_MNEMONIC:-}" ]]; then
  echo "STACKS_MNEMONIC is empty in backend/.env"
  exit 1
fi

export ROOT STACKS_MNEMONIC

python3 - <<'PY'
import os, re, pathlib
root = pathlib.Path(os.environ["ROOT"])
toml = root / "settings" / "Testnet.toml"
text = toml.read_text()
mnemonic = os.environ["STACKS_MNEMONIC"].strip().replace('"', '\\"')
text = re.sub(
    r'^mnemonic\s*=.*$',
    f'mnemonic = "{mnemonic}"',
    text,
    flags=re.M,
)
toml.write_text(text)
print("Updated settings/Testnet.toml deployer mnemonic")
PY

cd "$ROOT"
clarinet check
clarinet deployments generate --testnet --low-cost
echo ""
echo "Review deployments/default.testnet-plan.yaml then run:"
echo "  clarinet deployments apply -p deployments/default.testnet-plan.yaml"
echo ""
read -r -p "Apply deployment now? [y/N] " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  clarinet deployments apply -p deployments/default.testnet-plan.yaml
  echo "Done. Wire contract IDs into frontend-next/.env.local (see scripts/print-env.sh)"
fi
