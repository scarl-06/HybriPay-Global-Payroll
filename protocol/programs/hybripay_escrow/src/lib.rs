use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("HybP111111111111111111111111111111111111111");

#[program]
pub mod hybripay_escrow {
    use super::*;

    /// Initializes a new payroll escrow batch and deposits funds
    pub fn initialize_payroll(
        ctx: Context<InitializePayroll>,
        amount: u64,
        batch_id: String,
        approvals_required: u8,
    ) -> Result<()> {
        let payroll_state = &mut ctx.accounts.payroll_state;
        payroll_state.creator = *ctx.accounts.creator.key;
        payroll_state.amount = amount;
        payroll_state.batch_id = batch_id;
        payroll_state.approvals_required = approvals_required;
        payroll_state.approvals_received = 0;
        payroll_state.is_executed = false;
        payroll_state.employee = *ctx.accounts.employee.key;
        payroll_state.bump = ctx.bumps.payroll_state;
        
        // Transfer funds from creator to the escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Records an executive approval on-chain
    pub fn approve_payroll(ctx: Context<ApprovePayroll>) -> Result<()> {
        let payroll_state = &mut ctx.accounts.payroll_state;
        require!(!payroll_state.is_executed, ErrorCode::AlreadyExecuted);
        
        payroll_state.approvals_received += 1;
        msg!("Approval recorded. Count: {}/{}", payroll_state.approvals_received, payroll_state.approvals_required);
        Ok(())
    }

    /// Finalizes and RELEASES funds from the vault to the employee
    pub fn execute_payroll(ctx: Context<ExecutePayroll>) -> Result<()> {
        let payroll_state = &mut ctx.accounts.payroll_state;
        let amount = payroll_state.amount;
        let batch_id = payroll_state.batch_id.clone();
        
        // 1. Safety Checks
        require!(
            payroll_state.approvals_received >= payroll_state.approvals_required,
            ErrorCode::InsufficientApprovals
        );
        require!(!payroll_state.is_executed, ErrorCode::AlreadyExecuted);

        // 2. PDA Signer Seeds
        let seeds = &[
            b"payroll",
            batch_id.as_bytes(),
            &[payroll_state.bump],
        ];
        let signer = &[&seeds[..]];

        // 3. Perform the SPL-Token Transfer (Vault -> Employee)
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: payroll_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // 4. Mark as executed
        payroll_state.is_executed = true;
        
        msg!("Success: Released {} USDC for batch {}.", amount, batch_id);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, batch_id: String)]
pub struct InitializePayroll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    pub employee: AccountInfo<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 8 + 32 + 32 + 1 + 1 + 1 + 64, 
        seeds = [b"payroll", batch_id.as_bytes()],
        bump
    )]
    pub payroll_state: Account<'info, PayrollState>,
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApprovePayroll<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payroll_state: Account<'info, PayrollState>,
}

#[derive(Accounts)]
pub struct ExecutePayroll<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,
    #[account(mut)]
    pub payroll_state: Account<'info, PayrollState>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub employee_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct PayrollState {
    pub creator: Pubkey,
    pub amount: u64,
    pub employee: Pubkey,
    pub batch_id: String,
    pub approvals_required: u8,
    pub approvals_received: u8,
    pub is_executed: bool,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("This payroll batch has already been executed.")]
    AlreadyExecuted,
    #[msg("Insufficient executive approvals to release funds.")]
    InsufficientApprovals,
}
