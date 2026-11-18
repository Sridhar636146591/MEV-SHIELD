-- ============================================================
-- Supabase SQL Setup Script for MEV Shield
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── user_profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address                 TEXT UNIQUE,
  did                     TEXT UNIQUE,
  email                   TEXT UNIQUE,
  alias                   TEXT NOT NULL DEFAULT 'Anonymous',
  points                  INTEGER NOT NULL DEFAULT 0,
  level                   INTEGER NOT NULL DEFAULT 1,
  badges                  TEXT[] DEFAULT '{}',
  rewards                 JSONB DEFAULT '[]',
  protected_transactions  INTEGER NOT NULL DEFAULT 0,
  leaderboard_rank        INTEGER,
  alerts                  JSONB DEFAULT '{"sandwich":false,"frontrun":false,"backrun":false,"highGas":false,"highSlippage":false}',
  last_active_at          TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── auth_sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  wallet_address  TEXT,
  did             TEXT,
  jwt_id          TEXT UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- ── subscribers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT UNIQUE NOT NULL,
  alerts            JSONB DEFAULT '{"sandwich":true,"frontrun":true,"backrun":true,"highGas":true,"highSlippage":true}',
  subscribed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── transaction_history ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_history (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  tx_hash               TEXT UNIQUE NOT NULL,
  from_address          TEXT,
  to_address            TEXT,
  value                 NUMERIC(78, 0),
  gas_price             NUMERIC(78, 0),
  gas_used              NUMERIC(78, 0),
  status                TEXT,
  simulated             BOOLEAN DEFAULT FALSE,
  detected_attack_type  TEXT,
  risk_score            FLOAT,
  metadata              JSONB,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_history_recorded_at ON transaction_history(recorded_at);

-- ── mev_events ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mev_events (
  id                BIGSERIAL PRIMARY KEY,
  observed_at       TIMESTAMPTZ NOT NULL,
  network           TEXT NOT NULL,
  attack_type       TEXT NOT NULL,
  risk_score        FLOAT NOT NULL,
  slippage_loss     FLOAT NOT NULL,
  gas_price         NUMERIC(78, 0),
  transaction_hash  TEXT,
  victim_address    TEXT,
  attacker_address  TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mev_events_observed_at ON mev_events(observed_at);

-- ── gas_metrics ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gas_metrics (
  id           BIGSERIAL PRIMARY KEY,
  recorded_at  TIMESTAMPTZ NOT NULL,
  network      TEXT NOT NULL,
  slow         NUMERIC(30, 10),
  standard     NUMERIC(30, 10),
  fast         NUMERIC(30, 10),
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gas_metrics_recorded_at ON gas_metrics(recorded_at);

-- ── risk_score_snapshots ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_score_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  recorded_at   TIMESTAMPTZ NOT NULL,
  profile_id    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  network       TEXT,
  average_risk  FLOAT,
  max_risk      FLOAT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_recorded_at ON risk_score_snapshots(recorded_at);

-- ── Auto-update updated_at timestamps ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_auth_sessions_updated_at
  BEFORE UPDATE ON auth_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_transaction_history_updated_at
  BEFORE UPDATE ON transaction_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security (enable for production) ────────────────────────────────
-- Uncomment below once your auth is integrated with Supabase Auth
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Done! ✅
SELECT 'MEV Shield database schema created successfully!' AS status;
