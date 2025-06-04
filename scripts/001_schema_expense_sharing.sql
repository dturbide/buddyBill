-- =====================================================
-- EXPENSE SHARING APP - SCHÉMA DE BASE
-- Script 001: Configuration initiale et tables principales
-- =====================================================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Création des schémas
CREATE SCHEMA IF NOT EXISTS auth_expense;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;

-- 3. Types personnalisés (ENUM)
CREATE TYPE app.currency_type AS ENUM (
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN'
);

CREATE TYPE app.expense_status AS ENUM (
    'pending', 'approved', 'rejected', 'settled'
);

CREATE TYPE app.payment_status AS ENUM (
    'pending', 'completed', 'failed', 'cancelled'
);

CREATE TYPE app.group_member_role AS ENUM (
    'admin', 'member', 'viewer'
);

CREATE TYPE app.expense_split_type AS ENUM (
    'equal', 'percentage', 'amount', 'shares'
);

CREATE TYPE app.activity_type AS ENUM (
    'expense_created', 'expense_updated', 'expense_deleted',
    'payment_made', 'payment_received',
    'member_joined', 'member_left',
    'group_created', 'group_updated',
    'settlement_completed'
);

-- 4. Tables principales

-- 4.1 Profils utilisateurs étendus
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    preferred_currency app.currency_type DEFAULT 'USD',
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Groupes de partage
CREATE TABLE IF NOT EXISTS app.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    image_url TEXT,
    default_currency app.currency_type DEFAULT 'USD',
    is_invite_only BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- 4.3 Membres des groupes
CREATE TABLE IF NOT EXISTS app.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role app.group_member_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES public.user_profiles(id),
    invitation_status TEXT DEFAULT 'accepted', -- 'pending', 'accepted', 'rejected'
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- 4.4 Catégories de dépenses
CREATE TABLE IF NOT EXISTS app.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.5 Dépenses
CREATE TABLE IF NOT EXISTS app.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency app.currency_type NOT NULL,
    category_id UUID REFERENCES app.expense_categories(id),
    paid_by UUID NOT NULL REFERENCES public.user_profiles(id),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    status app.expense_status DEFAULT 'pending',
    split_type app.expense_split_type DEFAULT 'equal',
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE
);

-- 4.6 Participants aux dépenses (qui doit quoi)
CREATE TABLE IF NOT EXISTS app.expense_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES app.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount_owed DECIMAL(12,2) NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2), -- Pour split par pourcentage
    shares INTEGER, -- Pour split par parts
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(expense_id, user_id)
);

-- 4.7 Paiements/Remboursements
CREATE TABLE IF NOT EXISTS app.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    to_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency app.currency_type NOT NULL,
    payment_method TEXT, -- 'cash', 'bank_transfer', 'paypal', 'venmo', etc.
    reference_number TEXT,
    notes TEXT,
    status app.payment_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    CHECK (from_user_id != to_user_id)
);

-- 4.8 Balances des groupes (vue matérialisée pour performance)
CREATE TABLE IF NOT EXISTS app.group_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0, -- Positif = on vous doit, Négatif = vous devez
    currency app.currency_type NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 4.9 Historique d'activités
CREATE TABLE IF NOT EXISTS app.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES app.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    activity_type app.activity_type NOT NULL,
    entity_type TEXT, -- 'expense', 'payment', 'group', 'member'
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.10 Invitations de groupe
CREATE TABLE IF NOT EXISTS app.group_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.user_profiles(id),
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 5. Index pour optimisation
CREATE INDEX idx_group_members_group_id ON app.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON app.group_members(user_id);
CREATE INDEX idx_expenses_group_id ON app.expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON app.expenses(paid_by);
CREATE INDEX idx_expenses_date ON app.expenses(expense_date);
CREATE INDEX idx_expense_participants_expense_id ON app.expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user_id ON app.expense_participants(user_id);
CREATE INDEX idx_payments_group_id ON app.payments(group_id);
CREATE INDEX idx_payments_users ON app.payments(from_user_id, to_user_id);
CREATE INDEX idx_group_balances_group_user ON app.group_balances(group_id, user_id);
CREATE INDEX idx_activity_log_group_id ON app.activity_log(group_id);
CREATE INDEX idx_activity_log_user_id ON app.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON app.activity_log(created_at DESC);

-- 6. Insertion des catégories par défaut
INSERT INTO app.expense_categories (name, icon, color, is_default) VALUES
    ('Food & Dining', 'utensils', '#FF6B6B', true),
    ('Transport', 'car', '#4ECDC4', true),
    ('Accommodation', 'home', '#45B7D1', true),
    ('Entertainment', 'gamepad-2', '#96CEB4', true),
    ('Shopping', 'shopping-bag', '#DDA0DD', true),
    ('Utilities', 'zap', '#FFD93D', true),
    ('Healthcare', 'heart', '#FF8B94', true),
    ('Other', 'more-horizontal', '#B0B0B0', true)
ON CONFLICT DO NOTHING;

-- 7. Triggers pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON app.groups
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON app.expenses
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
