ALTER TABLE public.users
ADD COLUMN wallet_address TEXT UNIQUE;

COMMENT ON COLUMN public.users.wallet_address IS 'The user''s connected Web3 wallet address, linked for on-chain identity.';