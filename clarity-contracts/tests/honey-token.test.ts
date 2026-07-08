import { describe, it, expect, beforeEach } from "vitest";
import { Clarinet, Tx, Chain, Account } from "@stacks/clarinet-sdk";

describe("honey-token", () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  it("should initialize with zero supply", () => {
    const result = chain.callReadOnlyFn(
      "honey-token",
      "get-total-supply",
      [],
      accounts.get("deployer")!.address
    );
    expect(result.result).toContain("u0");
  });

  it("should mint tokens correctly", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "mint",
        [user.address, "u1000000"],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("true");

    const balance = chain.callReadOnlyFn(
      "honey-token",
      "get-balance",
      [user.address],
      deployer.address
    );
    expect(balance.result).toContain("u1000000");
  });

  it("should prevent unauthorized mint", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;
    const attacker = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "mint",
        [user.address, "u1000000"],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should enforce supply cap", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "mint",
        [user.address, "u1000000000000001"],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should transfer tokens correctly", () => {
    const deployer = accounts.get("deployer")!;
    const user1 = accounts.get("wallet_1")!;
    const user2 = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "mint",
        [user1.address, "u1000000"],
        deployer.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "transfer",
        ["u500000", user1.address, user2.address],
        user1.address
      ),
    ]);

    expect(tx[0].result).toContain("true");

    const balance1 = chain.callReadOnlyFn(
      "honey-token",
      "get-balance",
      [user1.address],
      deployer.address
    );
    expect(balance1.result).toContain("u500000");

    const balance2 = chain.callReadOnlyFn(
      "honey-token",
      "get-balance",
      [user2.address],
      deployer.address
    );
    expect(balance2.result).toContain("u500000");
  });

  it("should prevent transfer with insufficient balance", () => {
    const deployer = accounts.get("deployer")!;
    const user1 = accounts.get("wallet_1")!;
    const user2 = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "mint",
        [user1.address, "u100000"],
        deployer.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "transfer",
        ["u200000", user1.address, user2.address],
        user1.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should burn tokens correctly", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "honey-token",
        "mint",
        [user.address, "u1000000"],
        deployer.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("honey-token", "burn", ["u500000"], user.address),
    ]);

    expect(tx[0].result).toContain("true");

    const balance = chain.callReadOnlyFn(
      "honey-token",
      "get-balance",
      [user.address],
      deployer.address
    );
    expect(balance.result).toContain("u500000");

    const supply = chain.callReadOnlyFn(
      "honey-token",
      "get-total-supply",
      [],
      deployer.address
    );
    expect(supply.result).toContain("u500000");
  });

  it("should return correct token metadata", () => {
    const deployer = accounts.get("deployer")!;

    const name = chain.callReadOnlyFn(
      "honey-token",
      "get-name",
      [],
      deployer.address
    );
    expect(name.result).toContain("Honey");

    const symbol = chain.callReadOnlyFn(
      "honey-token",
      "get-symbol",
      [],
      deployer.address
    );
    expect(symbol.result).toContain("HONEY");

    const decimals = chain.callReadOnlyFn(
      "honey-token",
      "get-decimals",
      [],
      deployer.address
    );
    expect(decimals.result).toContain("u6");
  });
});
