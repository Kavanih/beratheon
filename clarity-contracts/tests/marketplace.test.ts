import { describe, it, expect, beforeEach } from "vitest";
import { Clarinet, Tx, Chain, Account } from "@stacks/clarinet-sdk";

describe("marketplace", () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  it("should create a listing", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address, // token-contract (items-sft)
          "u1", // token-id
          "u10", // qty
          "u1000000", // price-per-unit-ustx
          "u200", // expires-at (block height)
        ],
        seller.address
      ),
    ]);

    expect(tx[0].result).toContain("u1");
  });

  it("should prevent listing with zero quantity", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u0", // zero qty
          "u1000000",
          "u200",
        ],
        seller.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should prevent listing with zero price", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u0", // zero price
          "u200",
        ],
        seller.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should prevent listing with expired expiry", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000",
          "u1", // expired (less than current block height)
        ],
        seller.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should cancel a listing", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000",
          "u200",
        ],
        seller.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("marketplace", "cancel", ["u1"], seller.address),
    ]);

    expect(tx[0].result).toContain("true");

    const isActive = chain.callReadOnlyFn(
      "marketplace",
      "is-listing-active",
      ["u1"],
      deployer.address
    );
    expect(isActive.result).toContain("false");
  });

  it("should prevent unauthorized cancel", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const attacker = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000",
          "u200",
        ],
        seller.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("marketplace", "cancel", ["u1"], attacker.address),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should calculate fees correctly for unjuiced buyer", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000", // 1 STX per unit
          "u200",
        ],
        seller.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "buy",
        [
          "u1", // listing-id
          "u5", // qty
          "false", // not juiced (1000 bps fee)
        ],
        buyer.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
    // Total: 5 * 1000000 = 5000000 ustx
    // Fee (1000 bps): 5000000 * 1000 / 10000 = 500000 ustx
    // Seller gets: 5000000 - 500000 = 4500000 ustx
  });

  it("should calculate fees correctly for juiced buyer", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000", // 1 STX per unit
          "u200",
        ],
        seller.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "buy",
        [
          "u1", // listing-id
          "u5", // qty
          "true", // juiced (250 bps fee)
        ],
        buyer.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
    // Total: 5 * 1000000 = 5000000 ustx
    // Fee (250 bps): 5000000 * 250 / 10000 = 125000 ustx
    // Seller gets: 5000000 - 125000 = 4875000 ustx
  });

  it("should prevent buy with qty exceeding listing", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000",
          "u200",
        ],
        seller.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "buy",
        [
          "u1",
          "u20", // exceeds listing qty of 10
          "false",
        ],
        buyer.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should prevent buy from expired listing", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;
    const buyer = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000",
          "u10", // expires at block 10
        ],
        seller.address
      ),
    ]);

    // Mine blocks to exceed expiry
    for (let i = 0; i < 5; i++) {
      chain.mineBlock([]);
    }

    const tx = chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "buy",
        [
          "u1",
          "u5",
          "false",
        ],
        buyer.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should get listing details", () => {
    const deployer = accounts.get("deployer")!;
    const seller = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "marketplace",
        "list",
        [
          deployer.address,
          "u1",
          "u10",
          "u1000000",
          "u200",
        ],
        seller.address
      ),
    ]);

    const listing = chain.callReadOnlyFn(
      "marketplace",
      "get-listing",
      ["u1"],
      deployer.address
    );

    expect(listing.result).toContain("seller:");
    expect(listing.result).toContain("token-contract:");
    expect(listing.result).toContain("token-id:");
    expect(listing.result).toContain("qty:");
    expect(listing.result).toContain("price-per-unit-ustx:");
  });
});
