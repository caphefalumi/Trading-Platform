/*
  Warnings:

  - You are about to drop the column `is_primary` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `accounts` DROP FOREIGN KEY `accounts_user_id_fkey`;

-- DropIndex
DROP INDEX `accounts_user_id_fkey` ON `accounts`;

-- AlterTable
ALTER TABLE `accounts` DROP COLUMN `is_primary`,
    DROP COLUMN `user_id`,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `users`;

-- CreateIndex
CREATE UNIQUE INDEX `accounts_email_key` ON `accounts`(`email`);
