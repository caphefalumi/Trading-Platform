-- DropForeignKey
ALTER TABLE `audit_log` DROP FOREIGN KEY `audit_log_action_id_fkey`;

-- DropForeignKey
ALTER TABLE `audit_log` DROP FOREIGN KEY `audit_log_actor_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `audit_log` DROP FOREIGN KEY `audit_log_object_type_id_fkey`;

-- DropTable
DROP TABLE `audit_log`;

-- DropTable
DROP TABLE `action_types`;

-- DropTable
DROP TABLE `actor_types`;

-- DropTable
DROP TABLE `object_types`;
