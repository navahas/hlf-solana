#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;

declare_id!("HRf1wVnSxtGZUYR48yyNQADN1VcQYLK197wUshALsEux");

#[program]
pub mod solana_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Polling program initialized: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: String,
        options: Vec<String>,
        hlf_poll_id: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.id = poll_id;
        poll.creator = ctx.accounts.creator.key();
        poll.options = options;
        poll.hlf_poll_id = hlf_poll_id;
        poll.is_active = true;
        poll.total_votes = 0;
        poll.bump = ctx.bumps.poll;

        msg!("Poll created with ID: {}", poll.id);
        Ok(())
    }

    pub fn vote(
        ctx: Context<Vote>,
        poll_id: String,
        vote_option: String,
        hlf_vote_id: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let vote_record = &mut ctx.accounts.vote_record;
        
        require!(poll.is_active, ErrorCode::PollInactive);
        require!(poll.options.contains(&vote_option), ErrorCode::InvalidOption);
        
        vote_record.poll_id = poll_id.clone();
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.vote_option = vote_option;
        vote_record.hlf_vote_id = hlf_vote_id;
        vote_record.timestamp = Clock::get()?.unix_timestamp;
        vote_record.bump = ctx.bumps.vote_record;
        
        poll.total_votes += 1;
        
        msg!("Vote recorded for poll: {}", poll_id);
        Ok(())
    }

    pub fn close_poll(ctx: Context<ClosePoll>, _poll_id: String) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        require!(poll.creator == ctx.accounts.creator.key(), ErrorCode::Unauthorized);
        
        poll.is_active = false;
        msg!("Poll closed: {}", poll.id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
#[instruction(poll_id: String)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Poll::INIT_SPACE,
        seeds = [b"poll", poll_id.as_bytes()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: String)]
pub struct Vote<'info> {
    #[account(
        mut,
        seeds = [b"poll", poll_id.as_bytes()],
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", poll_id.as_bytes(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: String)]
pub struct ClosePoll<'info> {
    #[account(
        mut,
        seeds = [b"poll", poll_id.as_bytes()],
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,
    pub creator: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    #[max_len(32)]
    pub id: String,
    pub creator: Pubkey,
    #[max_len(4, 32)]
    pub options: Vec<String>,
    #[max_len(64)]
    pub hlf_poll_id: String,
    pub is_active: bool,
    pub total_votes: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    #[max_len(32)]
    pub poll_id: String,
    pub voter: Pubkey,
    #[max_len(32)]
    pub vote_option: String,
    #[max_len(64)]
    pub hlf_vote_id: String,
    pub timestamp: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Poll is not active")]
    PollInactive,
    #[msg("Invalid vote option")]
    InvalidOption,
    #[msg("Unauthorized action")]
    Unauthorized,
}
