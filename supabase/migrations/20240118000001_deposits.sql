-- Create deposits table
CREATE TABLE deposits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    vault_id BIGINT REFERENCES vaults(id) ON DELETE CASCADE,
    amount DECIMAL(36,18) NOT NULL,
    token_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_deposit CHECK (amount > 0)
);

-- Create indexes for deposits
CREATE INDEX idx_deposits_user ON deposits(user_id);
CREATE INDEX idx_deposits_vault ON deposits(vault_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_tx ON deposits(tx_hash);

-- Function to handle deposit confirmation
CREATE OR REPLACE FUNCTION confirm_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the vault's collateral amount
    UPDATE vaults
    SET 
        collateral_amount = collateral_amount + NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.vault_id;

    -- Update user's total deposits
    UPDATE users
    SET total_deposits = total_deposits + NEW.amount
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for deposit confirmation
CREATE TRIGGER trigger_deposit_confirmation
AFTER UPDATE OF status ON deposits
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'confirmed')
EXECUTE FUNCTION confirm_deposit();

-- Function to create a new deposit
CREATE OR REPLACE FUNCTION create_deposit(
    p_user_id BIGINT,
    p_amount DECIMAL,
    p_token_address TEXT,
    p_tx_hash TEXT
)
RETURNS JSON AS $$
DECLARE
    v_vault_id BIGINT;
    v_deposit_id BIGINT;
BEGIN
    -- Check if user has an active vault or create one
    SELECT id INTO v_vault_id
    FROM vaults
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND collateral_token = p_token_address
    LIMIT 1;

    IF v_vault_id IS NULL THEN
        INSERT INTO vaults (
            user_id,
            strategy_type,
            collateral_amount,
            collateral_token,
            strike_price,
            expiry_timestamp,
            ltv_ratio,
            health_factor,
            liquidation_threshold,
            tx_hash
        ) VALUES (
            p_user_id,
            'covered_call',  -- Default strategy
            0,              -- Will be updated on confirmation
            p_token_address,
            0,              -- Will be updated based on market price
            CURRENT_TIMESTAMP + INTERVAL '7 days',  -- Default 7-day expiry
            70.00,          -- Default 70% LTV
            100.00,         -- Initial health factor
            80.00,          -- Default liquidation threshold
            p_tx_hash
        ) RETURNING id INTO v_vault_id;
    END IF;

    -- Create the deposit record
    INSERT INTO deposits (
        user_id,
        vault_id,
        amount,
        token_address,
        tx_hash
    ) VALUES (
        p_user_id,
        v_vault_id,
        p_amount,
        p_token_address,
        p_tx_hash
    ) RETURNING id INTO v_deposit_id;

    RETURN json_build_object(
        'deposit_id', v_deposit_id,
        'vault_id', v_vault_id,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql; 