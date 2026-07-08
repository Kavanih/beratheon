#!/usr/bin/env bash
# Redeploy contracts that failed on the first testnet batch (conquest, cub-nft, marketplace).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/../backend/.env"
TESTNET_TOML="$ROOT/settings/Testnet.toml"
PLAN="$ROOT/deployments/redeploy-failed.testnet-plan.yaml"

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
clarinet check contracts/conquest.clar
clarinet check contracts/cub-nft.clar
clarinet check contracts/marketplace.clar
script -q -c "printf 'y\n' | clarinet deployments apply -p \"$PLAN\" --no-dashboard" /dev/null
echo ""
echo "Redeploy submitted. Verify on Hiro Explorer, then run scripts/print-env.sh"
