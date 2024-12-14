import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { RaydiumLiquidityInteraction } from "../target/types/raydium_liquidity_interaction";
import {add_and_remove_liquidity, setupDepositTest} from "./utils";

describe("add and remove liquidity test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  const program = anchor.workspace.RaydiumLiquidityInteraction as Program<RaydiumLiquidityInteraction>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("add and remove liquidity test", async () => {
    const cpSwapPoolState = await setupDepositTest(
      program,
      anchor.getProvider().connection,
      owner,
      { transferFeeBasisPoints: 0, MaxFee: 0 }
    );

    const liquidity = new BN(10000000000);
    const addAndRemoveTx = await add_and_remove_liquidity(
      program,
      owner,
      cpSwapPoolState.ammConfig,
      cpSwapPoolState.token0Mint,
      cpSwapPoolState.token0Program,
      cpSwapPoolState.token1Mint,
      cpSwapPoolState.token1Program,
      liquidity,
      new BN(10000000000),
      new BN(20000000000),
      confirmOptions
    );
    console.log("add and remove liquidity tx:", addAndRemoveTx);
  });
});
