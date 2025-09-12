
SET time_zone = '+00:00';

-- ==============================
-- Identity
-- ==============================
CREATE TABLE IF NOT EXISTS identity_users (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(32) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS identity_user_profiles (
  user_id BINARY(16) NOT NULL PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url VARCHAR(1024),
  dob DATE,
  default_address_id BINARY(16),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS identity_addresses (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  user_id BINARY(16) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(32),
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  ward VARCHAR(255),
  district VARCHAR(255),
  province VARCHAR(255),
  country CHAR(2) NOT NULL DEFAULT 'VN',
  postal_code VARCHAR(32),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_addresses_user (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS identity_consents (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  user_id BINARY(16) NOT NULL,
  type VARCHAR(64) NOT NULL, -- 'email_marketing', 'sms'
  granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  version VARCHAR(32) NOT NULL,
  UNIQUE KEY uq_consents (user_id, type, version),
  CONSTRAINT fk_consents_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================
-- Shop
-- ==============================
CREATE TABLE IF NOT EXISTS shop_shops (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  owner_user_id BINARY(16) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  logo_url VARCHAR(1024),
  rating_count INT NOT NULL DEFAULT 0,
  rating_sum INT NOT NULL DEFAULT 0,
  status ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
  policies JSON, -- return policy, shipping policy
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_shops_slug (slug),
  KEY idx_shops_owner (owner_user_id),
  CONSTRAINT fk_shops_owner FOREIGN KEY (owner_user_id) REFERENCES identity_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shop_payout_accounts (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  shop_id BINARY(16) NOT NULL,
  bank VARCHAR(128) NOT NULL,
  account_no_masked VARCHAR(64) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  verified_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_payout_accounts_shop (shop_id),
  CONSTRAINT fk_payout_shop FOREIGN KEY (shop_id) REFERENCES shop_shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================
-- Catalog
-- ==============================
CREATE TABLE IF NOT EXISTS catalog_categories (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  parent_id BINARY(16),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES catalog_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_attributes (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  name VARCHAR(255) NOT NULL,
  input_type ENUM('text','select','number','boolean') NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_category_attributes (
  category_id BINARY(16) NOT NULL,
  attribute_id BINARY(16) NOT NULL,
  PRIMARY KEY (category_id, attribute_id),
  CONSTRAINT fk_cat_attr_category FOREIGN KEY (category_id) REFERENCES catalog_categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_cat_attr_attribute FOREIGN KEY (attribute_id) REFERENCES catalog_attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_listings (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  shop_id BINARY(16) NOT NULL,
  category_id BINARY(16),
  title VARCHAR(255) NOT NULL,
  description MEDIUMTEXT,
  `condition` VARCHAR(64),
  brand VARCHAR(128),
  price DECIMAL(14,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku VARCHAR(128),
  status ENUM('draft','active','paused','banned','archived') NOT NULL DEFAULT 'draft',
  moderation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  seo_slug VARCHAR(255),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_listings_seo (seo_slug),
  KEY idx_listings_shop (shop_id),
  KEY idx_listings_category (category_id),
  KEY idx_listings_status (status, moderation_status),
  FULLTEXT KEY fts_listings_title_desc (title, description),
  CONSTRAINT fk_listings_shop FOREIGN KEY (shop_id) REFERENCES shop_shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_listings_category FOREIGN KEY (category_id) REFERENCES catalog_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_listing_variants (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  listing_id BINARY(16) NOT NULL,
  variant_sku VARCHAR(128),
  attrs JSON,
  price DECIMAL(14,2) CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_variants_listing (listing_id),
  CONSTRAINT fk_variants_listing FOREIGN KEY (listing_id) REFERENCES catalog_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_media (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  listing_id BINARY(16) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  mime VARCHAR(128),
  width INT,
  height INT,
  size_bytes BIGINT,
  content_hash VARCHAR(128),
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_media_listing (listing_id),
  CONSTRAINT fk_media_listing FOREIGN KEY (listing_id) REFERENCES catalog_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalog_price_history (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  listing_id BINARY(16) NOT NULL,
  old_price DECIMAL(14,2) NOT NULL CHECK (old_price >= 0),
  new_price DECIMAL(14,2) NOT NULL CHECK (new_price >= 0),
  changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_price_history_listing (listing_id, changed_at),
  CONSTRAINT fk_price_history_listing FOREIGN KEY (listing_id) REFERENCES catalog_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================
-- Orders
-- ==============================
CREATE TABLE IF NOT EXISTS order_orders (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  buyer_id BINARY(16) NOT NULL,
  status ENUM('created','awaiting_payment','paid','packed','shipped','delivered','completed','cancelled','refunded') NOT NULL DEFAULT 'created',
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  shipping_address_snapshot JSON NOT NULL,
  escrow_state VARCHAR(64),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_orders_buyer (buyer_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES identity_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_order_items (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  order_id BINARY(16) NOT NULL,
  listing_id BINARY(16) NOT NULL,
  seller_id BINARY(16) NOT NULL, -- shop id
  variant_id BINARY(16),
  qty INT NOT NULL CHECK (qty > 0),
  title VARCHAR(255) NOT NULL,
  attrs JSON,
  unit_price DECIMAL(14,2) NOT NULL CHECK (unit_price >= 0),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_seller (seller_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_listing FOREIGN KEY (listing_id) REFERENCES catalog_listings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_seller FOREIGN KEY (seller_id) REFERENCES shop_shops(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES catalog_listing_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_returns (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  order_id BINARY(16) NOT NULL,
  order_item_id BINARY(16) NOT NULL,
  reason VARCHAR(255),
  evidence JSON,
  status VARCHAR(64) NOT NULL DEFAULT 'requested',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_returns_order (order_id),
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_returns_item FOREIGN KEY (order_item_id) REFERENCES order_order_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================
-- Fulfillment
-- ==============================
CREATE TABLE IF NOT EXISTS fulfillment_shipments (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  order_id BINARY(16) NOT NULL,
  seller_id BINARY(16) NOT NULL,
  carrier VARCHAR(64) NOT NULL,
  service VARCHAR(64),
  tracking_no VARCHAR(128) UNIQUE,
  label_url VARCHAR(1024),
  status ENUM('pending','label_created','in_transit','delivered','lost','returned') NOT NULL DEFAULT 'pending',
  shipped_at DATETIME(6),
  delivered_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_shipments_order (order_id),
  KEY idx_shipments_seller (seller_id),
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_shipments_seller FOREIGN KEY (seller_id) REFERENCES shop_shops(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==============================
-- Payments
-- ==============================
CREATE TABLE IF NOT EXISTS payment_payments (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  order_id BINARY(16) NOT NULL,
  provider VARCHAR(64) NOT NULL, -- VNPay/MoMo/Stripe
  method VARCHAR(32) NOT NULL,   -- card, wallet, bank_transfer
  amount DECIMAL(14,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  status ENUM('pending','authorized','captured','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
  provider_ref VARCHAR(255),
  idempotency_key VARCHAR(128),
  risk_score DECIMAL(6,2),
  paid_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_payment_idem (order_id, provider, idempotency_key),
  KEY idx_payments_order (order_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_refunds (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  payment_id BINARY(16) NOT NULL,
  amount DECIMAL(14,2) NOT NULL CHECK (amount >= 0),
  reason VARCHAR(255),
  processed_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_refunds_payment (payment_id),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payment_payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_fee_rules (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  category_id BINARY(16),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6),
  CONSTRAINT fk_fee_rules_category FOREIGN KEY (category_id) REFERENCES catalog_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ledger
CREATE TABLE IF NOT EXISTS payment_ledger_accounts (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  shop_id BINARY(16), -- null = platform-level
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  `type` ENUM('asset','liability','income','expense','equity') NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_ledger_journals (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  ref VARCHAR(255),
  description VARCHAR(1024),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_ledger_postings (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  journal_id BINARY(16) NOT NULL,
  account_id BINARY(16) NOT NULL,
  order_id BINARY(16),
  amount DECIMAL(14,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  direction ENUM('debit','credit') NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_postings_account (account_id),
  KEY idx_postings_journal (journal_id),
  CONSTRAINT fk_postings_journal FOREIGN KEY (journal_id) REFERENCES payment_ledger_journals(id) ON DELETE CASCADE,
  CONSTRAINT fk_postings_account FOREIGN KEY (account_id) REFERENCES payment_ledger_accounts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_postings_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_settlements (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  shop_id BINARY(16) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  refunds_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  fees_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_payable DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_settlement_period (shop_id, period_start, period_end),
  CONSTRAINT fk_settlements_shop FOREIGN KEY (shop_id) REFERENCES shop_shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_payouts (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  settlement_id BINARY(16) NOT NULL,
  bank_ref VARCHAR(255),
  amount DECIMAL(14,2) NOT NULL,
  paid_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_payouts_settlement FOREIGN KEY (settlement_id) REFERENCES payment_settlements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================
-- Messaging
-- ==============================
CREATE TABLE IF NOT EXISTS messaging_conversations (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messaging_conversation_participants (
  conversation_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  PRIMARY KEY (conversation_id, user_id),
  KEY idx_participants_user (user_id),
  CONSTRAINT fk_participants_conversation FOREIGN KEY (conversation_id) REFERENCES messaging_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_participants_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messaging_messages (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  conversation_id BINARY(16) NOT NULL,
  sender_id BINARY(16) NOT NULL,
  body MEDIUMTEXT,
  attachments JSON,
  read_by JSON, -- array-like JSON
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_messages_conversation (conversation_id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES messaging_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES identity_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==============================
-- Reviews
-- ==============================
CREATE TABLE IF NOT EXISTS review_reviews (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  listing_id BINARY(16),
  shop_id BINARY(16),
  order_item_id BINARY(16) UNIQUE,
  reviewer_id BINARY(16) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content MEDIUMTEXT,
  media JSON,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_reviews_listing (listing_id),
  KEY idx_reviews_shop (shop_id),
  CONSTRAINT fk_reviews_listing FOREIGN KEY (listing_id) REFERENCES catalog_listings(id) ON DELETE SET NULL,
  CONSTRAINT fk_reviews_shop FOREIGN KEY (shop_id) REFERENCES shop_shops(id) ON DELETE SET NULL,
  CONSTRAINT fk_reviews_order_item FOREIGN KEY (order_item_id) REFERENCES order_order_items(id) ON DELETE SET NULL,
  CONSTRAINT fk_reviews_user FOREIGN KEY (reviewer_id) REFERENCES identity_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS review_review_helpfulness (
  review_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (review_id, user_id),
  CONSTRAINT fk_helpfulness_review FOREIGN KEY (review_id) REFERENCES review_reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_helpfulness_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================
-- Promotions
-- ==============================
CREATE TABLE IF NOT EXISTS promo_vouchers (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  code VARCHAR(64) NOT NULL,
  scope ENUM('platform','shop') NOT NULL DEFAULT 'platform',
  shop_id BINARY(16),
  type ENUM('percent','fixed','free_ship') NOT NULL,
  value DECIMAL(14,2) NOT NULL CHECK (value >= 0),
  min_spend DECIMAL(14,2) NOT NULL DEFAULT 0,
  quota INT NOT NULL DEFAULT 0, -- 0 = unlimited
  per_user_limit INT NOT NULL DEFAULT 1,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  starts_at DATETIME(6) NOT NULL,
  ends_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_voucher_code (code),
  CONSTRAINT fk_vouchers_shop FOREIGN KEY (shop_id) REFERENCES shop_shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS promo_voucher_redemptions (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  voucher_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  order_id BINARY(16),
  redeemed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_redemptions (voucher_id, user_id, order_id),
  KEY idx_redemptions_user (user_id),
  CONSTRAINT fk_redemptions_voucher FOREIGN KEY (voucher_id) REFERENCES promo_vouchers(id) ON DELETE CASCADE,
  CONSTRAINT fk_redemptions_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_redemptions_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==============================
-- Trust & Safety
-- ==============================
CREATE TABLE IF NOT EXISTS tns_moderation_queue (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  entity_type VARCHAR(64) NOT NULL, -- listing, review, message
  entity_id BINARY(16) NOT NULL,
  reason VARCHAR(255),
  model_score DECIMAL(6,2),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  decided_by BINARY(16),
  decided_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_moderation_entity (entity_type, entity_id),
  CONSTRAINT fk_moderation_decider FOREIGN KEY (decided_by) REFERENCES identity_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tns_disputes (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  order_id BINARY(16) NOT NULL,
  opened_by BINARY(16) NOT NULL,
  role ENUM('buyer','seller') NOT NULL,
  reason VARCHAR(255),
  evidence JSON,
  status ENUM('open','resolved','rejected') NOT NULL DEFAULT 'open',
  result VARCHAR(1024),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_disputes_order (order_id),
  CONSTRAINT fk_disputes_order FOREIGN KEY (order_id) REFERENCES order_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_disputes_opener FOREIGN KEY (opened_by) REFERENCES identity_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==============================
-- Notifications
-- ==============================
CREATE TABLE IF NOT EXISTS notification_templates (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  code VARCHAR(64) NOT NULL,
  channel ENUM('email','inapp','sms','push') NOT NULL,
  locale VARCHAR(16) NOT NULL DEFAULT 'vi-VN',
  subject VARCHAR(255),
  body MEDIUMTEXT,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_template_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_notifications (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  user_id BINARY(16) NOT NULL,
  channel ENUM('email','inapp','sms','push') NOT NULL,
  template_id BINARY(16),
  payload JSON NOT NULL,
  delivered_at DATETIME(6),
  delivery_status ENUM('queued','sent','failed') DEFAULT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_notifications_user (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES identity_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_template FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==============================
-- Analytics / Events
-- ==============================
CREATE TABLE IF NOT EXISTS analytics_domain_events (
  id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID(), 1)),
  event_name VARCHAR(128) NOT NULL,
  occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  actor_user_id BINARY(16),
  entity_type VARCHAR(64),
  entity_id BINARY(16),
  payload JSON,
  KEY idx_events_time (occurred_at),
  KEY idx_events_name (event_name),
  CONSTRAINT fk_events_actor FOREIGN KEY (actor_user_id) REFERENCES identity_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==============================
-- Seed minimal ledger accounts
-- ==============================
INSERT INTO payment_ledger_accounts (id, shop_id, code, name, `type`)
SELECT UUID_TO_BIN(UUID(), 1), NULL, 'PLATFORM_CASH', 'Platform Cash', 'asset'
WHERE NOT EXISTS (SELECT 1 FROM payment_ledger_accounts WHERE code='PLATFORM_CASH');

INSERT INTO payment_ledger_accounts (id, shop_id, code, name, `type`)
SELECT UUID_TO_BIN(UUID(), 1), NULL, 'ESCROW', 'Customer Escrow', 'liability'
WHERE NOT EXISTS (SELECT 1 FROM payment_ledger_accounts WHERE code='ESCROW');

INSERT INTO payment_ledger_accounts (id, shop_id, code, name, `type`)
SELECT UUID_TO_BIN(UUID(), 1), NULL, 'COMMISSIONS_INCOME', 'Commissions Income', 'income'
WHERE NOT EXISTS (SELECT 1 FROM payment_ledger_accounts WHERE code='COMMISSIONS_INCOME');
