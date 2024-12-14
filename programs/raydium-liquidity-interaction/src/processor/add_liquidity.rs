use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use raydium_cp_swap::{cpi, program::RaydiumCpSwap, states::PoolState};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    pub cp_swap_program: Program<'info, RaydiumCpSwap>,
    pub owner: Signer<'info>,
    /// CHECK: pool vault and lp mint authority
    #[account(
    seeds = [
    raydium_cp_swap::AUTH_SEED.as_bytes(),
    ],
    seeds::program = cp_swap_program,
    bump,
    )]
    pub authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub pool_state: AccountLoader<'info, PoolState>,
    #[account(mut,  token::authority = owner)]
    pub owner_lp_token: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
    mut,
    token::mint = token_0_vault.mint,
    token::authority = owner
    )]
    pub token_0_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
    mut,
    token::mint = token_1_vault.mint,
    token::authority = owner
    )]
    pub token_1_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
    mut,
    constraint = token_0_vault.key() == pool_state.load()?.token_0_vault
    )]
    pub token_0_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
    mut,
    constraint = token_1_vault.key() == pool_state.load()?.token_1_vault
    )]
    pub token_1_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub token_program_2022: Program<'info, Token2022>,
    #[account(
    address = token_0_vault.mint
    )]
    pub vault_0_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
    address = token_1_vault.mint
    )]
    pub vault_1_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
    mut,
    address = pool_state.load()?.lp_mint)
    ]
    pub lp_mint: Box<InterfaceAccount<'info, Mint>>,
}

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    lp_token_amount: u64,
    maximum_token_0_amount: u64,
    maximum_token_1_amount: u64,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::Deposit {
        owner: ctx.accounts.owner.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        owner_lp_token: ctx.accounts.owner_lp_token.to_account_info(),
        token_0_account: ctx.accounts.token_0_account.to_account_info(),
        token_1_account: ctx.accounts.token_1_account.to_account_info(),
        token_0_vault: ctx.accounts.token_0_vault.to_account_info(),
        token_1_vault: ctx.accounts.token_1_vault.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_program_2022: ctx.accounts.token_program_2022.to_account_info(),
        vault_0_mint: ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint: ctx.accounts.vault_1_mint.to_account_info(),
        lp_mint: ctx.accounts.lp_mint.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.cp_swap_program.to_account_info(), cpi_accounts);
    cpi::deposit(
        cpi_context,
        lp_token_amount,
        maximum_token_0_amount,
        maximum_token_1_amount,
    )
}
