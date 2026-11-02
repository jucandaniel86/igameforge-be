-- AlterTable
ALTER TABLE `game_resource_types` ADD COLUMN `field_options` TEXT NULL,
    ADD COLUMN `field_priority` INTEGER NOT NULL DEFAULT 0;
