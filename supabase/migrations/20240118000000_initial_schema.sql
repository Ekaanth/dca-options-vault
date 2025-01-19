-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE strategy_type AS ENUM ('covered_call', 'protective_put', 'collar');
CREATE TYPE vault_status AS ENUM ('active', 'liquidated', 'closed');
CREATE TYPE option_type AS ENUM ('call', 'put');
CREATE TYPE option_status AS ENUM ('active', 'exercised', 'expired');
CREATE TYPE loan_status AS ENUM ('active', 'repaid', 'liquidated');

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    first_connected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_connected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_deposits DECIMAL(36,18) DEFAULT 0,
    total_borrows DECIMAL(36,18) DEFAULT 0,
    active_positions INTEGER DEFAULT 0,
    CONSTRAINT valid_wallet CHECK (wallet_address ~ '^0x[a-fA-F0-9]{63,64}$')
);

-- Create vaults table
CREATE TABLE vaults (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    strategy_type strategy_type NOT NULL,
    collateral_amount DECIMAL(36,18) NOT NULL,
    collateral_token TEXT NOT NULL,
    strike_price DECIMAL(36,18) NOT NULL,
    expiry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    premium_earned DECIMAL(36,18) DEFAULT 0,
    ltv_ratio DECIMAL(5,2) NOT NULL,
    health_factor DECIMAL(5,2) NOT NULL,
    liquidation_threshold DECIMAL(5,2) NOT NULL,
    status vault_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tx_hash TEXT NOT NULL,
    CONSTRAINT valid_ltv CHECK (ltv_ratio BETWEEN 0 AND 100),
    CONSTRAINT valid_health CHECK (health_factor > 0),
    CONSTRAINT valid_liquidation CHECK (liquidation_threshold BETWEEN 0 AND 100),
    CONSTRAINT future_expiry CHECK (expiry_timestamp > created_at)
);

-- Create options table
CREATE TABLE options (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    vault_id BIGINT REFERENCES vaults(id) ON DELETE CASCADE,
    option_type option_type NOT NULL,
    strike_price DECIMAL(36,18) NOT NULL,
    expiry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    premium DECIMAL(36,18) NOT NULL,
    locked_amount DECIMAL(36,18) NOT NULL,
    status option_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tx_hash TEXT NOT NULL,
    
    CONSTRAINT positive_premium CHECK (premium > 0),
    CONSTRAINT positive_locked_amount CHECK (locked_amount > 0),
    CONSTRAINT future_expiry CHECK (expiry_timestamp > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_vaults_user ON vaults(user_id);
CREATE INDEX idx_vaults_status ON vaults(status);
CREATE INDEX idx_options_vault ON options(vault_id);
CREATE INDEX idx_options_user ON options(user_id);
CREATE INDEX idx_options_status ON options(status);
CREATE INDEX idx_loans_vault ON loans(vault_id);
CREATE INDEX idx_loans_status ON loans(status);

-- Function to update vault health factor
CREATE OR REPLACE FUNCTION update_vault_health_factor()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate health factor based on collateral value and loan amount
    WITH vault_totals AS (
        SELECT 
            v.id,
            v.collateral_amount * v.strike_price AS collateral_value,
            COALESCE(SUM(l.amount), 0) AS total_loans
        FROM vaults v
        LEFT JOIN loans l ON l.vault_id = v.id AND l.status = 'active'
        WHERE v.id = NEW.vault_id
        GROUP BY v.id
    )
    UPDATE vaults v
    SET health_factor = 
        CASE 
            WHEN vt.total_loans = 0 THEN 999.99 -- Max health if no loans
            ELSE (vt.collateral_value / vt.total_loans) * 100
        END
    FROM vault_totals vt
    WHERE v.id = vt.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update health factor on loan changes
CREATE TRIGGER trigger_update_health_factor
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_vault_health_factor();

-- Function to check liquidation conditions
CREATE OR REPLACE FUNCTION check_liquidation_conditions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.health_factor < NEW.liquidation_threshold THEN
        UPDATE vaults 
        SET status = 'liquidated' 
        WHERE id = NEW.id;
        
        UPDATE loans 
        SET status = 'liquidated' 
        WHERE vault_id = NEW.id AND status = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check liquidation on health factor update
CREATE TRIGGER trigger_check_liquidation
AFTER UPDATE OF health_factor ON vaults
FOR EACH ROW
EXECUTE FUNCTION check_liquidation_conditions();

-- Function to update user position counts
CREATE OR REPLACE FUNCTION update_user_positions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET active_positions = active_positions + 1
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status = 'active' THEN
        UPDATE users 
        SET active_positions = active_positions - 1
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user positions on vault changes
CREATE TRIGGER trigger_update_user_positions
AFTER INSERT OR UPDATE ON vaults
FOR EACH ROW
EXECUTE FUNCTION update_user_positions(); 