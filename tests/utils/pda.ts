import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
export const POOL_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("pool"));
export const POOL_VAULT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("pool_vault")
);
export const POOL_AUTH_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("vault_and_lp_mint_auth_seed")
);
export const POOL_LPMINT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("pool_lp_mint")
);

export const ORACLE_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("observation")
);

export async function getAuthAddress(
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_AUTH_SEED],
    programId
  );
  return [address, bump];
}

export async function getPoolAddress(
  ammConfig: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [
      POOL_SEED,
      ammConfig.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    programId
  );
  return [address, bump];
}

export async function getPoolVaultAddress(
  pool: PublicKey,
  vaultTokenMint: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_VAULT_SEED, pool.toBuffer(), vaultTokenMint.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getPoolLpMintAddress(
  pool: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_LPMINT_SEED, pool.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getOrcleAccountAddress(
  pool: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [ORACLE_SEED, pool.toBuffer()],
    programId
  );
  return [address, bump];
}
