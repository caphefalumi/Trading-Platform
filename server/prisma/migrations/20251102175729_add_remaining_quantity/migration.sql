-- AlterTable
ALTER TABLE `orders` ADD COLUMN `remaining_quantity` DECIMAL(18, 8) NULL;

-- Update existing orders to calculate remaining_quantity
UPDATE `orders` SET `remaining_quantity` = `quantity` - `filled_quantity` WHERE `remaining_quantity` IS NULL;
