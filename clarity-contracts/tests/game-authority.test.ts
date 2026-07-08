import { describe, it, expect, beforeEach } from "vitest";
import { Clarinet, Tx, Chain, Account } from "@stacks/clarinet-sdk";

describe("game-authority", () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  it("should grant loot to recipient", () => {
    const owner = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "grant-loot",
        [
          recipient.address,
          [
            { "token-id": "u1", qty: "u10" },
            { "token-id": "u2", qty: "u5" },
          ],
        ],
        owner.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
  });

  it("should prevent unauthorized loot grant", () => {
    const recipient = accounts.get("wallet_1")!;
    const attacker = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "grant-loot",
        [
          recipient.address,
          [{ "token-id": "u1", qty: "u10" }],
        ],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should grant honey tokens", () => {
    const owner = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "grant-honey",
        [recipient.address, "u1000000"],
        owner.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
  });

  it("should prevent unauthorized honey grant", () => {
    const recipient = accounts.get("wallet_1")!;
    const attacker = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "grant-honey",
        [recipient.address, "u1000000"],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should grant juice tokens", () => {
    const owner = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "grant-juice",
        [recipient.address, "u100"],
        owner.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
  });

  it("should prevent replay attacks on dungeon settlement", () => {
    const owner = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    // First settlement with nonce
    const runHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const signature = "0x" + "00".repeat(65);
    const pubkey = "0x" + "00".repeat(33);

    const tx1 = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "settle-dungeon-run",
        [
          runHash,
          recipient.address,
          [{ "token-id": "u1", qty: "u10" }],
          "u1000000",
          signature,
          pubkey,
        ],
        owner.address
      ),
    ]);

    // Second settlement with same nonce should fail
    const tx2 = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "settle-dungeon-run",
        [
          runHash,
          recipient.address,
          [{ "token-id": "u1", qty: "u10" }],
          "u1000000",
          signature,
          pubkey,
        ],
        owner.address
      ),
    ]);

    expect(tx2[0].result).toContain("err");
  });

  it("should set game-signer", () => {
    const owner = accounts.get("deployer")!;
    const newSigner = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "set-game-signer",
        [newSigner.address],
        owner.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
  });

  it("should prevent unauthorized game-signer change", () => {
    const attacker = accounts.get("wallet_1")!;
    const newSigner = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "set-game-signer",
        [newSigner.address],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should set owner", () => {
    const owner = accounts.get("deployer")!;
    const newOwner = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "set-owner",
        [newOwner.address],
        owner.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
  });

  it("should prevent unauthorized owner change", () => {
    const attacker = accounts.get("wallet_1")!;
    const newOwner = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "game-authority",
        "set-owner",
        [newOwner.address],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });
});
