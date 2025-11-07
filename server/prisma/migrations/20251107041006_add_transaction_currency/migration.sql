-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `currency_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
