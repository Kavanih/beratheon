import { describe, it, expect, beforeEach } from "vitest";
import { Clarinet, Tx, Chain, Account } from "@stacks/clarinet-sdk";

describe("crafting", () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  it("should register a recipe", () => {
    const deployer = accounts.get("deployer")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [
            { "token-id": "u1", qty: "u10" },
            { "token-id": "u2", qty: "u5" },
          ], // inputs
          [{ "token-id": "u3", qty: "u1" }], // outputs
          "u1", // station (alchemy)
          "u1", // xp-kind
          "u100", // xp-amt
        ],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("u1");
  });

  it("should prevent unauthorized recipe registration", () => {
    const attacker = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should prevent recipe with invalid station", () => {
    const deployer = accounts.get("deployer")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u99", // invalid station
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should prevent recipe with no inputs", () => {
    const deployer = accounts.get("deployer")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [], // empty inputs
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should prevent recipe with no outputs", () => {
    const deployer = accounts.get("deployer")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [], // empty outputs
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should get recipe details", () => {
    const deployer = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u2", // workbench
          "u2", // xp-kind
          "u50",
        ],
        deployer.address
      ),
    ]);

    const recipe = chain.callReadOnlyFn(
      "crafting",
      "get-recipe",
      ["u1"],
      deployer.address
    );

    expect(recipe.result).toContain("inputs:");
    expect(recipe.result).toContain("outputs:");
    expect(recipe.result).toContain("station:");
    expect(recipe.result).toContain("xp-kind:");
    expect(recipe.result).toContain("xp-amt:");
    expect(recipe.result).toContain("enabled:");
  });

  it("should craft and grant XP", () => {
    const deployer = accounts.get("deployer")!;
    const crafter = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("crafting", "craft", ["u1"], crafter.address),
    ]);

    expect(tx[0].result).toContain("true");

    const xp = chain.callReadOnlyFn(
      "crafting",
      "get-player-xp",
      [crafter.address, "u1"],
      deployer.address
    );

    expect(xp.result).toContain("u100");
  });

  it("should prevent crafting disabled recipe", () => {
    const deployer = accounts.get("deployer")!;
    const crafter = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall("crafting", "disable-recipe", ["u1"], deployer.address),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("crafting", "craft", ["u1"], crafter.address),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should accumulate XP across multiple crafts", () => {
    const deployer = accounts.get("deployer")!;
    const crafter = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    // First craft
    chain.mineBlock([
      Tx.contractCall("crafting", "craft", ["u1"], crafter.address),
    ]);

    // Second craft
    chain.mineBlock([
      Tx.contractCall("crafting", "craft", ["u1"], crafter.address),
    ]);

    const xp = chain.callReadOnlyFn(
      "crafting",
      "get-player-xp",
      [crafter.address, "u1"],
      deployer.address
    );

    expect(xp.result).toContain("u200");
  });

  it("should disable recipe", () => {
    const deployer = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("crafting", "disable-recipe", ["u1"], deployer.address),
    ]);

    expect(tx[0].result).toContain("true");

    const recipe = chain.callReadOnlyFn(
      "crafting",
      "get-recipe",
      ["u1"],
      deployer.address
    );

    expect(recipe.result).toContain("enabled:");
    expect(recipe.result).toContain("false");
  });

  it("should prevent unauthorized recipe disable", () => {
    const deployer = accounts.get("deployer")!;
    const attacker = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "register-recipe",
        [
          [{ "token-id": "u1", qty: "u10" }],
          [{ "token-id": "u3", qty: "u1" }],
          "u1",
          "u1",
          "u100",
        ],
        deployer.address
      ),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall("crafting", "disable-recipe", ["u1"], attacker.address),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should set authority", () => {
    const deployer = accounts.get("deployer")!;
    const newAuthority = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "set-authority",
        [newAuthority.address],
        deployer.address
      ),
    ]);

    expect(tx[0].result).toContain("true");
  });

  it("should prevent unauthorized authority change", () => {
    const attacker = accounts.get("wallet_1")!;
    const newAuthority = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall(
        "crafting",
        "set-authority",
        [newAuthority.address],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });
});
