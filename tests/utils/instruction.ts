import { Program, BN } from "@coral-xyz/anchor";
import { RaydiumLiquidityInteraction } from "../../target/types/raydium_liquidity_interaction";
import {
  Connection,
  ConfirmOptions,
  PublicKey,
  Keypair,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  getAuthAddress,
  getPoolAddress,
  getPoolLpMintAddress,
  getPoolVaultAddress,
  createTokenMintAndAssociatedTokenAccount,
  getOrcleAccountAddress,
} from "./index";

import { cpSwapProgram, configAddress, createPoolFeeReceive } from "../config";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { CpmmPoolInfoLayout } from "@raydium-io/raydium-sdk-v2";

export async function setupDepositTest(
  program: Program<RaydiumLiquidityInteraction>,
  connection: Connection,
  owner: Signer,
  transferFeeConfig: { transferFeeBasisPoints: number; MaxFee: number } = {
    transferFeeBasisPoints: 0,
    MaxFee: 0,
  },
  confirmOptions?: ConfirmOptions,
  initAmount: { initAmount0: BN; initAmount1: BN } = {
    initAmount0: new BN(10000000000),
    initAmount1: new BN(20000000000),
  },
  tokenProgramRequired?: {
    token0Program: PublicKey;
    token1Program: PublicKey;
  }
) {
  while (1) {
    const [{ token0, token0Program }, { token1, token1Program }] =
      await createTokenMintAndAssociatedTokenAccount(
        connection,
        owner,
        new Keypair(),
        transferFeeConfig
      );

    if (tokenProgramRequired != undefined) {
      if (
        token0Program.equals(tokenProgramRequired.token0Program) &&
        token1Program.equals(tokenProgramRequired.token1Program)
      ) {
        const { cpSwapPoolState } = await initialize(
          program,
          owner,
          configAddress,
          token0,
          token0Program,
          token1,
          token1Program,
          confirmOptions,
          initAmount
        );
        return cpSwapPoolState;
      }
    } else {
      const { cpSwapPoolState } = await initialize(
        program,
        owner,
        configAddress,
        token0,
        token0Program,
        token1,
        token1Program,
        confirmOptions,
        initAmount
      );
      return cpSwapPoolState;
    }
  }
}

export async function initialize(
  program: Program<RaydiumLiquidityInteraction>,
  creator: Signer,
  configAddress: PublicKey,
  token0: PublicKey,
  token0Program: PublicKey,
  token1: PublicKey,
  token1Program: PublicKey,
  confirmOptions?: ConfirmOptions,
  initAmount: { initAmount0: BN; initAmount1: BN } = {
    initAmount0: new BN(10000000000),
    initAmount1: new BN(20000000000),
  },
  createPoolFee = createPoolFeeReceive
) {
  const [auth] = await getAuthAddress(cpSwapProgram);
  const [poolAddress] = await getPoolAddress(
    configAddress,
    token0,
    token1,
    cpSwapProgram
  );
  const [lpMintAddress] = await getPoolLpMintAddress(
    poolAddress,
    cpSwapProgram
  );
  const [vault0] = await getPoolVaultAddress(
    poolAddress,
    token0,
    cpSwapProgram
  );
  const [vault1] = await getPoolVaultAddress(
    poolAddress,
    token1,
    cpSwapProgram
  );
  const [creatorLpTokenAddress] = await PublicKey.findProgramAddress(
    [
      creator.publicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      lpMintAddress.toBuffer(),
    ],
    ASSOCIATED_PROGRAM_ID
  );

  const [observationAddress] = await getOrcleAccountAddress(
    poolAddress,
    cpSwapProgram
  );

  const creatorToken0 = getAssociatedTokenAddressSync(
    token0,
    creator.publicKey,
    false,
    token0Program
  );
  const creatorToken1 = getAssociatedTokenAddressSync(
    token1,
    creator.publicKey,
    false,
    token1Program
  );
  const tx = await program.methods
    .initialize(initAmount.initAmount0, initAmount.initAmount1, new BN(0))
    .accounts({
      cpSwapProgram: cpSwapProgram,
      creator: creator.publicKey,
      ammConfig: configAddress,
      authority: auth,
      poolState: poolAddress,
      token0Mint: token0,
      token1Mint: token1,
      lpMint: lpMintAddress,
      creatorToken0,
      creatorToken1,
      creatorLpToken: creatorLpTokenAddress,
      token0Vault: vault0,
      token1Vault: vault1,
      createPoolFee,
      observationState: observationAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
      token0Program: token0Program,
      token1Program: token1Program,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ])
    .rpc(confirmOptions);
  const accountInfo = await program.provider.connection.getAccountInfo(
    poolAddress
  );
  const poolState = CpmmPoolInfoLayout.decode(accountInfo.data);
  const cpSwapPoolState = {
    ammConfig: poolState.configId,
    token0Mint: poolState.mintA,
    token0Program: poolState.mintProgramA,
    token1Mint: poolState.mintB,
    token1Program: poolState.mintProgramB,
  };
  return { poolAddress, cpSwapPoolState, tx };
}

export async function add_liquidity(
  program: Program<RaydiumLiquidityInteraction>,
  owner: Signer,
  configAddress: PublicKey,
  token0: PublicKey,
  token0Program: PublicKey,
  token1: PublicKey,
  token1Program: PublicKey,
  lp_token_amount: BN,
  maximum_token_0_amount: BN,
  maximum_token_1_amount: BN,
  confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(cpSwapProgram);
  const [poolAddress] = await getPoolAddress(
    configAddress,
    token0,
    token1,
    cpSwapProgram
  );
  const [lpMintAddress] = await getPoolLpMintAddress(
    poolAddress,
    cpSwapProgram
  );
  const [vault0] = await getPoolVaultAddress(
    poolAddress,
    token0,
    cpSwapProgram
  );
  const [vault1] = await getPoolVaultAddress(
    poolAddress,
    token1,
    cpSwapProgram
  );
  const [ownerLpToken] = await PublicKey.findProgramAddress(
    [
      owner.publicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      lpMintAddress.toBuffer(),
    ],
    ASSOCIATED_PROGRAM_ID
  );

  const ownerToken0 = getAssociatedTokenAddressSync(
    token0,
    owner.publicKey,
    false,
    token0Program
  );
  const ownerToken1 = getAssociatedTokenAddressSync(
    token1,
    owner.publicKey,
    false,
    token1Program
  );

  const tx = await program.methods
    .addLiquidity(
      lp_token_amount,
      maximum_token_0_amount,
      maximum_token_1_amount
    )
    .accounts({
      cpSwapProgram: cpSwapProgram,
      owner: owner.publicKey,
      authority: auth,
      poolState: poolAddress,
      ownerLpToken,
      token0Account: ownerToken0,
      token1Account: ownerToken1,
      token0Vault: vault0,
      token1Vault: vault1,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      vault0Mint: token0,
      vault1Mint: token1,
      lpMint: lpMintAddress,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ])
    .rpc(confirmOptions);
  return tx;
}

export async function remove_liquidity(
  program: Program<RaydiumLiquidityInteraction>,
  owner: Signer,
  configAddress: PublicKey,
  token0: PublicKey,
  token0Program: PublicKey,
  token1: PublicKey,
  token1Program: PublicKey,
  lp_token_amount: BN,
  minimum_token_0_amount: BN,
  minimum_token_1_amount: BN,
  confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(cpSwapProgram);
  const [poolAddress] = await getPoolAddress(
    configAddress,
    token0,
    token1,
    cpSwapProgram
  );

  const [lpMintAddress] = await getPoolLpMintAddress(
    poolAddress,
    cpSwapProgram
  );
  const [vault0] = await getPoolVaultAddress(
    poolAddress,
    token0,
    cpSwapProgram
  );
  const [vault1] = await getPoolVaultAddress(
    poolAddress,
    token1,
    cpSwapProgram
  );
  const [ownerLpToken] = await PublicKey.findProgramAddress(
    [
      owner.publicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      lpMintAddress.toBuffer(),
    ],
    ASSOCIATED_PROGRAM_ID
  );

  const onwerToken0 = getAssociatedTokenAddressSync(
    token0,
    owner.publicKey,
    false,
    token0Program
  );
  const onwerToken1 = getAssociatedTokenAddressSync(
    token1,
    owner.publicKey,
    false,
    token1Program
  );

  const tx = await program.methods
    .removeLiquidity(
      lp_token_amount,
      minimum_token_0_amount,
      minimum_token_1_amount
    )
    .accounts({
      cpSwapProgram: cpSwapProgram,
      owner: owner.publicKey,
      authority: auth,
      poolState: poolAddress,
      ownerLpToken,
      token0Account: onwerToken0,
      token1Account: onwerToken1,
      token0Vault: vault0,
      token1Vault: vault1,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      vault0Mint: token0,
      vault1Mint: token1,
      lpMint: lpMintAddress,
      memoProgram: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ])
    .rpc(confirmOptions)
    .catch();

  return tx;
}

export async function add_and_remove_liquidity(
    program: Program<RaydiumLiquidityInteraction>,
    owner: Signer,
    configAddress: PublicKey,
    token0: PublicKey,
    token0Program: PublicKey,
    token1: PublicKey,
    token1Program: PublicKey,
    lp_token_amount: BN,
    minimum_token_0_amount: BN,
    minimum_token_1_amount: BN,
    confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(cpSwapProgram);
  const [poolAddress] = await getPoolAddress(
      configAddress,
      token0,
      token1,
      cpSwapProgram
  );

  const [lpMintAddress] = await getPoolLpMintAddress(
      poolAddress,
      cpSwapProgram
  );
  const [vault0] = await getPoolVaultAddress(
      poolAddress,
      token0,
      cpSwapProgram
  );
  const [vault1] = await getPoolVaultAddress(
      poolAddress,
      token1,
      cpSwapProgram
  );
  const [ownerLpToken] = await PublicKey.findProgramAddress(
      [
        owner.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        lpMintAddress.toBuffer(),
      ],
      ASSOCIATED_PROGRAM_ID
  );

  const ownerToken0 = getAssociatedTokenAddressSync(
      token0,
      owner.publicKey,
      false,
      token0Program
  );
  const ownerToken1 = getAssociatedTokenAddressSync(
      token1,
      owner.publicKey,
      false,
      token1Program
  );

  const tx = await program.methods
      .addAndRemoveLiquidity(
          lp_token_amount,
          minimum_token_0_amount,
          minimum_token_1_amount
      )
      .accounts({
        cpSwapProgram: cpSwapProgram,
        owner: owner.publicKey,
        authority: auth,
        poolState: poolAddress,
        ownerLpToken,
        token0Account: ownerToken0,
        token1Account: ownerToken1,
        token0Vault: vault0,
        token1Vault: vault1,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        vault0Mint: token0,
        vault1Mint: token1,
        lpMint: lpMintAddress,
        memoProgram: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ])
      .rpc(confirmOptions)
      .catch();

  return tx;
}