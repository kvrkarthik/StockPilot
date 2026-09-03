-- ==========================================
-- StockPilot Supabase PostgreSQL SQL Script
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE orderstatus AS ENUM ('draft', 'pending', 'partially_received', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transactiontype AS ENUM ('stock_in', 'stock_out', 'transfer', 'adjustment', 'purchase', 'sale');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE adjustmenttype AS ENUM ('increase', 'decrease', 'damage', 'expiry', 'correction');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Base Tables
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_categories_name ON categories (name);
CREATE INDEX IF NOT EXISTS ix_categories_deleted_at ON categories (deleted_at);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(320) UNIQUE,
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS ix_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS ix_customers_deleted_at ON customers (deleted_at);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS ix_permissions_code ON permissions (code);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_roles_name ON roles (name);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(180) DEFAULT 'Smart Inventory' NOT NULL,
    company_address TEXT,
    tax_percentage NUMERIC(5, 2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    theme VARCHAR(20) DEFAULT 'system' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(320) UNIQUE,
    phone VARCHAR(30),
    address TEXT,
    tax_id VARCHAR(80) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_suppliers_name ON suppliers (name);
CREATE INDEX IF NOT EXISTS ix_suppliers_deleted_at ON suppliers (deleted_at);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(80) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    price NUMERIC(12, 2) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 0 NOT NULL,
    minimum_stock INTEGER DEFAULT 0 NOT NULL,
    maximum_stock INTEGER,
    image_url VARCHAR(500),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS ix_products_name ON products (name);
CREATE INDEX IF NOT EXISTS ix_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS ix_products_supplier_id ON products (supplier_id);
CREATE INDEX IF NOT EXISTS ix_products_expiry_date ON products (expiry_date);
CREATE INDEX IF NOT EXISTS ix_products_deleted_at ON products (deleted_at);
CREATE INDEX IF NOT EXISTS ix_products_name_sku ON products (name, sku);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS ix_users_role_id ON users (role_id);
CREATE INDEX IF NOT EXISTS ix_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    transaction_type transactiontype NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    notes TEXT,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_inventory_transactions_product_id ON inventory_transactions (product_id);
CREATE INDEX IF NOT EXISTS ix_inventory_transactions_transaction_type ON inventory_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS ix_inventory_transactions_reference_id ON inventory_transactions (reference_id);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    kind VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_kind ON notifications (kind);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status orderstatus DEFAULT 'pending' NOT NULL,
    invoice_number VARCHAR(100),
    expected_date DATE,
    notes TEXT,
    total NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_order_number ON purchase_orders (order_number);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_supplier_id ON purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_status ON purchase_orders (status);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_invoice_number ON purchase_orders (invoice_number);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at ON refresh_tokens (expires_at);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    tax NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    total NUMERIC(14, 2) NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_sales_invoice_number ON sales (invoice_number);
CREATE INDEX IF NOT EXISTS ix_sales_customer_id ON sales (customer_id);

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    adjustment_type adjustmenttype NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_stock_adjustments_product_id ON stock_adjustments (product_id);
CREATE INDEX IF NOT EXISTS ix_stock_adjustments_adjustment_type ON stock_adjustments (adjustment_type);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0 NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    CONSTRAINT uq_purchase_order_items_purchase_order_id UNIQUE (purchase_order_id, product_id)
);
CREATE INDEX IF NOT EXISTS ix_purchase_order_items_purchase_order_id ON purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS ix_purchase_order_items_product_id ON purchase_order_items (product_id);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_sale_items_sale_id ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS ix_sale_items_product_id ON sale_items (product_id);

-- Ensure column defaults
ALTER TABLE roles ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE roles ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE settings ALTER COLUMN tax_percentage SET DEFAULT 0;

-- 3. Seed Initial System Data
INSERT INTO permissions (code, description) VALUES
('*', 'Allows *'),
('products.write', 'Allows products.write'),
('products.delete', 'Allows products.delete'),
('inventory.write', 'Allows inventory.write'),
('purchases.write', 'Allows purchases.write'),
('purchases.receive', 'Allows purchases.receive'),
('sales.write', 'Allows sales.write'),
('reports.read', 'Allows reports.read'),
('settings.write', 'Allows settings.write'),
('users.write', 'Allows users.write'),
('audit.read', 'Allows audit.read')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
(1, 'Admin', 'Admin system role', NOW(), NOW()),
(2, 'Manager', 'Manager system role', NOW(), NOW()),
(3, 'Inventory Staff', 'Inventory Staff system role', NOW(), NOW()),
(4, 'Sales Staff', 'Sales Staff system role', NOW(), NOW()),
(5, 'Viewer', 'Viewer system role', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Link Roles & Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Default Settings & Categories
INSERT INTO settings (id, company_name, tax_percentage, currency, theme, created_at, updated_at) VALUES (1, 'Smart Inventory', 0, 'INR', 'system', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Food & Beverages', 'Food, drinks, and consumable products', NOW(), NOW()),
('Personal Care', 'Personal hygiene and care products', NOW(), NOW()),
('Cleaning', 'Cleaning and household maintenance products', NOW(), NOW()),
('Stationery', 'Office and stationery products', NOW(), NOW()),
('Electronics', 'Electronic and electrical products', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
