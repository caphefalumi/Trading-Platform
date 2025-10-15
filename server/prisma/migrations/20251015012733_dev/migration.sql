/*
  Warnings:

  - You are about to drop the `ACCOUNT` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ACCOUNT_BALANCES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ACTION_TYPES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ACTOR_TYPES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ASSET_CLASSES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AUDIT_LOG` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CURRENCIES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EXECUTIONS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `INSTRUMENTS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LEDGER_ENTRIES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LEDGER_ENTRY_TYPES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MARKET_QUOTES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OBJECT_TYPES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ORDERS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ORDER_SIDES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ORDER_STATUSES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ORDER_TYPES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `POSITIONS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TIME_IN_FORCE_TYPES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TRANSACTIONS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TRANSACTION_STATUSES` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TRANSACTION_TYPES` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ACCOUNT` DROP FOREIGN KEY `ACCOUNT_currency_id_fkey`;

-- DropForeignKey
ALTER TABLE `ACCOUNT_BALANCES` DROP FOREIGN KEY `ACCOUNT_BALANCES_account_id_fkey`;

-- DropForeignKey
ALTER TABLE `ACCOUNT_BALANCES` DROP FOREIGN KEY `ACCOUNT_BALANCES_currency_id_fkey`;

-- DropForeignKey
ALTER TABLE `AUDIT_LOG` DROP FOREIGN KEY `AUDIT_LOG_action_id_fkey`;

-- DropForeignKey
ALTER TABLE `AUDIT_LOG` DROP FOREIGN KEY `AUDIT_LOG_actor_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `AUDIT_LOG` DROP FOREIGN KEY `AUDIT_LOG_object_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `EXECUTIONS` DROP FOREIGN KEY `EXECUTIONS_instrument_id_fkey`;

-- DropForeignKey
ALTER TABLE `EXECUTIONS` DROP FOREIGN KEY `EXECUTIONS_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `INSTRUMENTS` DROP FOREIGN KEY `INSTRUMENTS_asset_class_id_fkey`;

-- DropForeignKey
ALTER TABLE `INSTRUMENTS` DROP FOREIGN KEY `INSTRUMENTS_currency_id_fkey`;

-- DropForeignKey
ALTER TABLE `LEDGER_ENTRIES` DROP FOREIGN KEY `LEDGER_ENTRIES_account_id_fkey`;

-- DropForeignKey
ALTER TABLE `LEDGER_ENTRIES` DROP FOREIGN KEY `LEDGER_ENTRIES_currency_id_fkey`;

-- DropForeignKey
ALTER TABLE `LEDGER_ENTRIES` DROP FOREIGN KEY `LEDGER_ENTRIES_entry_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `MARKET_QUOTES` DROP FOREIGN KEY `MARKET_QUOTES_instrument_id_fkey`;

-- DropForeignKey
ALTER TABLE `ORDERS` DROP FOREIGN KEY `ORDERS_account_id_fkey`;

-- DropForeignKey
ALTER TABLE `ORDERS` DROP FOREIGN KEY `ORDERS_instrument_id_fkey`;

-- DropForeignKey
ALTER TABLE `ORDERS` DROP FOREIGN KEY `ORDERS_side_id_fkey`;

-- DropForeignKey
ALTER TABLE `ORDERS` DROP FOREIGN KEY `ORDERS_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `ORDERS` DROP FOREIGN KEY `ORDERS_time_in_force_id_fkey`;

-- DropForeignKey
ALTER TABLE `ORDERS` DROP FOREIGN KEY `ORDERS_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `POSITIONS` DROP FOREIGN KEY `POSITIONS_account_id_fkey`;

-- DropForeignKey
ALTER TABLE `POSITIONS` DROP FOREIGN KEY `POSITIONS_instrument_id_fkey`;

-- DropForeignKey
ALTER TABLE `TRANSACTIONS` DROP FOREIGN KEY `TRANSACTIONS_account_id_fkey`;

-- DropForeignKey
ALTER TABLE `TRANSACTIONS` DROP FOREIGN KEY `TRANSACTIONS_currency_id_fkey`;

-- DropForeignKey
ALTER TABLE `TRANSACTIONS` DROP FOREIGN KEY `TRANSACTIONS_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `TRANSACTIONS` DROP FOREIGN KEY `TRANSACTIONS_tx_type_id_fkey`;

-- DropTable
DROP TABLE `ACCOUNT`;

-- DropTable
DROP TABLE `ACCOUNT_BALANCES`;

-- DropTable
DROP TABLE `ACTION_TYPES`;

-- DropTable
DROP TABLE `ACTOR_TYPES`;

-- DropTable
DROP TABLE `ASSET_CLASSES`;

-- DropTable
DROP TABLE `AUDIT_LOG`;

-- DropTable
DROP TABLE `CURRENCIES`;

-- DropTable
DROP TABLE `EXECUTIONS`;

-- DropTable
DROP TABLE `INSTRUMENTS`;

-- DropTable
DROP TABLE `LEDGER_ENTRIES`;

-- DropTable
DROP TABLE `LEDGER_ENTRY_TYPES`;

-- DropTable
DROP TABLE `MARKET_QUOTES`;

-- DropTable
DROP TABLE `OBJECT_TYPES`;

-- DropTable
DROP TABLE `ORDERS`;

-- DropTable
DROP TABLE `ORDER_SIDES`;

-- DropTable
DROP TABLE `ORDER_STATUSES`;

-- DropTable
DROP TABLE `ORDER_TYPES`;

-- DropTable
DROP TABLE `POSITIONS`;

-- DropTable
DROP TABLE `TIME_IN_FORCE_TYPES`;

-- DropTable
DROP TABLE `TRANSACTIONS`;

-- DropTable
DROP TABLE `TRANSACTION_STATUSES`;

-- DropTable
DROP TABLE `TRANSACTION_TYPES`;

-- CreateTable
CREATE TABLE `currencies` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `currencies_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `asset_classes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instruments` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `asset_class_id` VARCHAR(191) NOT NULL,
    `lot_size` DECIMAL(18, 8) NOT NULL,
    `tick_size` DECIMAL(18, 8) NOT NULL,
    `currency_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `instruments_symbol_key`(`symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sides` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `order_sides_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_statuses` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `order_statuses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `order_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_in_force_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `time_in_force_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `currency_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `accounts_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_token_key`(`token`),
    INDEX `sessions_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `instrument_id` VARCHAR(191) NOT NULL,
    `side_id` SMALLINT NOT NULL,
    `type_id` SMALLINT NOT NULL,
    `status_id` SMALLINT NOT NULL,
    `time_in_force_id` SMALLINT NULL,
    `client_order_id` VARCHAR(191) NULL,
    `price` DECIMAL(18, 8) NULL,
    `quantity` DECIMAL(18, 8) NOT NULL,
    `filled_quantity` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_client_order_id_key`(`client_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `executions` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `counterparty_order_id` VARCHAR(191) NULL,
    `price` DECIMAL(18, 8) NOT NULL,
    `quantity` DECIMAL(18, 8) NOT NULL,
    `executed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `liquidity` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `instrument_id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 8) NOT NULL,
    `average_price` DECIMAL(18, 8) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `positions_account_instrument_unique`(`account_id`, `instrument_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_entry_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,

    UNIQUE INDEX `ledger_entry_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `entry_type_id` SMALLINT NOT NULL,
    `amount` DECIMAL(18, 8) NOT NULL,
    `reference_id` VARCHAR(191) NULL,
    `reference_table` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_balances` (
    `account_id` VARCHAR(191) NOT NULL,
    `available` DECIMAL(18, 8) NOT NULL,
    `reserved` DECIMAL(18, 8) NOT NULL,
    `total` DECIMAL(18, 8) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `market_quotes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `instrument_id` VARCHAR(191) NOT NULL,
    `bid_price` DECIMAL(18, 8) NULL,
    `ask_price` DECIMAL(18, 8) NULL,
    `last_price` DECIMAL(18, 8) NULL,
    `volume` DECIMAL(18, 8) NULL,
    `ts` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_market_quotes_instrument_ts`(`instrument_id`, `ts`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,

    UNIQUE INDEX `transaction_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_statuses` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `transaction_statuses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `tx_type_id` SMALLINT NOT NULL,
    `status_id` SMALLINT NOT NULL,
    `amount` DECIMAL(18, 8) NOT NULL,
    `external_ref` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actor_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `actor_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `action_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,

    UNIQUE INDEX `action_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `object_types` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `object_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `actor_id` VARCHAR(191) NULL,
    `actor_type_id` SMALLINT NULL,
    `action_id` SMALLINT NULL,
    `object_type_id` SMALLINT NULL,
    `object_id` VARCHAR(191) NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `instruments` ADD CONSTRAINT `instruments_asset_class_id_fkey` FOREIGN KEY (`asset_class_id`) REFERENCES `asset_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instruments` ADD CONSTRAINT `instruments_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_side_id_fkey` FOREIGN KEY (`side_id`) REFERENCES `order_sides`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `order_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `order_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_time_in_force_id_fkey` FOREIGN KEY (`time_in_force_id`) REFERENCES `time_in_force_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `executions` ADD CONSTRAINT `executions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_entry_type_id_fkey` FOREIGN KEY (`entry_type_id`) REFERENCES `ledger_entry_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_balances` ADD CONSTRAINT `account_balances_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `market_quotes` ADD CONSTRAINT `market_quotes_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_tx_type_id_fkey` FOREIGN KEY (`tx_type_id`) REFERENCES `transaction_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `transaction_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_actor_type_id_fkey` FOREIGN KEY (`actor_type_id`) REFERENCES `actor_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `action_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_object_type_id_fkey` FOREIGN KEY (`object_type_id`) REFERENCES `object_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
