pub mod processor;
use processor::*;

use anchor_lang::prelude::*;

declare_id!("FWehx5BDacMCXKmS9JpxW5UFGnvF1QhtpgqUFKeMTUPk");

#[program]
pub mod raydium_liquidity_interaction {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        init_amount_0: u64,
        init_amount_1: u64,
        open_time: u64,
    ) -> Result<()> {
        processor::initialize(ctx, init_amount_0, init_amount_1, open_time)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        lp_token_amount: u64,
        maximum_token_0_amount: u64,
        maximum_token_1_amount: u64,
    ) -> Result<()> {
        processor::add_liquidity(
            ctx,
            lp_token_amount,
            maximum_token_0_amount,
            maximum_token_1_amount,
        )
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_token_amount: u64,
        maximum_token_0_amount: u64,
        maximum_token_1_amount: u64,
    ) -> Result<()> {
        processor::remove_liquidity(
            ctx,
            lp_token_amount,
            maximum_token_0_amount,
            maximum_token_1_amount,
        )
    }

    pub fn add_and_remove_liquidity(
        ctx: Context<AddAndRemoveLiquidity>,
        lp_token_amount: u64,
        maximum_token_0_amount: u64,
        maximum_token_1_amount: u64,
    ) -> Result<()> {
        processor::add_and_remove_liquidity(
            ctx,
            lp_token_amount,
            maximum_token_0_amount,
            maximum_token_1_amount,
        )
    }
}
