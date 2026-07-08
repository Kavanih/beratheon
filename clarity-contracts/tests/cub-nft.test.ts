import { describe, it, expect, beforeEach } from "vitest";
import { Clarinet, Tx, Chain, Account } from "@stacks/clarinet-sdk";

describe("cub-nft", () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  it("should initialize with zero tokens", () => {
    const deployer = accounts.get("deployer")!;

    const result = chain.callReadOnlyFn(
      "cub-nft",
      "get-last-token-id",
      [],
      deployer.address
    );
    expect(result.result).toContain("u0");
  });

  it("should mint a cub NFT", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    const tx = chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user.address], deployer.address),
    ]);

    expect(tx[0].result).toContain("u1");

    const lastId = chain.callReadOnlyFn(
      "cub-nft",
      "get-last-token-id",
      [],
      deployer.address
    );
    expect(lastId.result).toContain("u1");
  });

  it("should prevent unauthorized mint", () => {
    const user = accounts.get("wallet_1")!;
    const attacker = accounts.get("wallet_2")!;

    const tx = chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user.address], attacker.address),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should enforce 10000 supply cap", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    // Mint 10000 cubs
    for (let i = 0; i < 10000; i++) {
      chain.mineBlock([
        Tx.contractCall("cub-nft", "mint", [user.address], deployer.address),
      ]);
    }

    // 10001st mint should fail
    const tx = chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user.address], deployer.address),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should generate deterministic traits on mint", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user.address], deployer.address),
    ]);

    const traits = chain.callReadOnlyFn(
      "cub-nft",
      "get-cub-data",
      ["u1"],
      deployer.address
    );

    expect(traits.result).toContain("head:");
    expect(traits.result).toContain("body:");
    expect(traits.result).toContain("accent:");
    expect(traits.result).toContain("born:");
  });

  it("should return correct owner", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user.address], deployer.address),
    ]);

    const owner = chain.callReadOnlyFn(
      "cub-nft",
      "get-owner",
      ["u1"],
      deployer.address
    );

    expect(owner.result).toContain(user.address);
  });

  it("should transfer cub NFT", () => {
    const deployer = accounts.get("deployer")!;
    const user1 = accounts.get("wallet_1")!;
    const user2 = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user1.address], deployer.address),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "cub-nft",
        "transfer",
        ["u1", user1.address, user2.address],
        user1.address
      ),
    ]);

    expect(tx[0].result).toContain("true");

    const owner = chain.callReadOnlyFn(
      "cub-nft",
      "get-owner",
      ["u1"],
      deployer.address
    );

    expect(owner.result).toContain(user2.address);
  });

  it("should prevent unauthorized transfer", () => {
    const deployer = accounts.get("deployer")!;
    const user1 = accounts.get("wallet_1")!;
    const user2 = accounts.get("wallet_2")!;
    const attacker = accounts.get("wallet_3")!;

    chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user1.address], deployer.address),
    ]);

    const tx = chain.mineBlock([
      Tx.contractCall(
        "cub-nft",
        "transfer",
        ["u1", user1.address, user2.address],
        attacker.address
      ),
    ]);

    expect(tx[0].result).toContain("err");
  });

  it("should initialize URI root once", () => {
    const deployer = accounts.get("deployer")!;
    const root = "ipfs://QmTest";

    const tx1 = chain.mineBlock([
      Tx.contractCall(
        "cub-nft",
        "initialize-uri-root",
        [root],
        deployer.address
      ),
    ]);

    expect(tx1[0].result).toContain("true");

    // Second initialization should fail
    const tx2 = chain.mineBlock([
      Tx.contractCall(
        "cub-nft",
        "initialize-uri-root",
        [root],
        deployer.address
      ),
    ]);

    expect(tx2[0].result).toContain("err");
  });

  it("should return correct token URI", () => {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;
    const root = "ipfs://QmTest";

    chain.mineBlock([
      Tx.contractCall(
        "cub-nft",
        "initialize-uri-root",
        [root],
        deployer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall("cub-nft", "mint", [user.address], deployer.address),
    ]);

    const uri = chain.callReadOnlyFn(
      "cub-nft",
      "get-token-uri",
      ["u1"],
      deployer.address
    );

    expect(uri.result).toContain("ipfs://QmTest");
    expect(uri.result).toContain("1");
  });
});
