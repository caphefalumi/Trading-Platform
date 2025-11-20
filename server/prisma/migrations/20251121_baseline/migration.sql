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
    `base_currency_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `accounts_email_key`(`email`),
    INDEX `accounts_base_currency_id_fkey`(`base_currency_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_balances` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `currency_id` VARCHAR(191) NOT NULL,
    `available` DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
    `reserved` DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `account_balances_currency_id_fkey`(`currency_id`),
    UNIQUE INDEX `account_balance_unique`(`account_id`, `currency_id`),
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
    INDEX `sessions_account_id_expires_at_idx`(`account_id`, `expires_at`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
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
    `filled_quantity` DECIMAL(18, 8) NOT NULL DEFAULT 0.00000000,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `remaining_quantity` DECIMAL(18, 8) NULL,

    UNIQUE INDEX `orders_client_order_id_key`(`client_order_id`),
    INDEX `orders_instrument_id_side_id_status_id_created_at_idx`(`instrument_id`, `side_id`, `status_id`, `created_at`),
    INDEX `orders_account_id_status_id_idx`(`account_id`, `status_id`),
    INDEX `orders_account_id_created_at_idx`(`account_id`, `created_at` DESC),
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

    INDEX `executions_order_id_idx`(`order_id`),
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

    INDEX `positions_instrument_id_fkey`(`instrument_id`),
    INDEX `positions_instrument_id_quantity_idx`(`instrument_id`, `quantity` DESC),
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

    INDEX `ledger_entries_account_id_created_at_idx`(`account_id`, `created_at`),
    INDEX `ledger_entries_entry_type_id_fkey`(`entry_type_id`),
    INDEX `ledger_entries_reference_id_idx`(`reference_id`),
    PRIMARY KEY (`id`)
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

    UNIQUE INDEX `uq_market_quotes_instrument_ts`(`instrument_id`, `ts` DESC),
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
    `currency_id` VARCHAR(191) NULL,

    INDEX `transactions_account_id_status_id_tx_type_id_idx`(`account_id`, `status_id`, `tx_type_id`),
    INDEX `transactions_account_id_created_at_idx`(`account_id`, `created_at`),
    INDEX `transactions_currency_id_fkey`(`currency_id`),
    INDEX `transactions_status_id_fkey`(`status_id`),
    INDEX `transactions_tx_type_id_fkey`(`tx_type_id`),
    INDEX `transactions_amount_idx`(`amount`),
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
    INDEX `instruments_asset_class_id_fkey`(`asset_class_id`),
    INDEX `instruments_currency_id_fkey`(`currency_id`),
    INDEX `instruments_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instrument_prices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `instrument_id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `open_price` DECIMAL(18, 8) NULL,
    `close_price` DECIMAL(18, 8) NULL,
    `volume` DECIMAL(18, 8) NULL,

    UNIQUE INDEX `uq_instrument_price_instrument_ts`(`instrument_id`, `timestamp` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_base_currency_id_fkey` FOREIGN KEY (`base_currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_balances` ADD CONSTRAINT `account_balances_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_balances` ADD CONSTRAINT `account_balances_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_side_id_fkey` FOREIGN KEY (`side_id`) REFERENCES `order_sides`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `order_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_time_in_force_id_fkey` FOREIGN KEY (`time_in_force_id`) REFERENCES `time_in_force_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `order_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `market_quotes` ADD CONSTRAINT `market_quotes_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `transaction_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_tx_type_id_fkey` FOREIGN KEY (`tx_type_id`) REFERENCES `transaction_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instruments` ADD CONSTRAINT `instruments_asset_class_id_fkey` FOREIGN KEY (`asset_class_id`) REFERENCES `asset_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instruments` ADD CONSTRAINT `instruments_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instrument_prices` ADD CONSTRAINT `instrument_prices_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

