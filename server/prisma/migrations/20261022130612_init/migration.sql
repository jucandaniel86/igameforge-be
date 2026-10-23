-- CreateTable
CREATE TABLE `operators` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rgs_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `site_id` VARCHAR(255) NOT NULL,
    `brands` JSON NULL,
    `env` VARCHAR(255) NOT NULL DEFAULT 'dev',
    `contract_type` ENUM('REV', 'TIERS') NOT NULL,
    `rev_share` DECIMAL(10, 2) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `games` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `game_id` INTEGER NULL,
    `site_id` VARCHAR(255) NULL,
    `brand_id` VARCHAR(50) NULL,
    `title` VARCHAR(255) NULL,
    `provider` VARCHAR(255) NULL,
    `env` VARCHAR(10) NOT NULL,
    `theoretical_rtp` DECIMAL(5, 2) NULL,
    `rtp_sd` DECIMAL(10, 4) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_resources` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `game_id` VARCHAR(255) NOT NULL,
    `operator_id` VARCHAR(255) NOT NULL,
    `field_id` INTEGER NOT NULL,
    `env` ENUM('dev', 'uat', 'prod', 'prng') NOT NULL DEFAULT 'dev',
    `language` VARCHAR(50) NOT NULL,
    `content` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_resource_types` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `field_key` VARCHAR(255) NOT NULL,
    `field_label` VARCHAR(255) NOT NULL,
    `field_type` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_operator_fields` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `field_label` VARCHAR(255) NOT NULL,
    `field_key` VARCHAR(255) NOT NULL,
    `field_type` VARCHAR(255) NOT NULL,
    `field_values` TEXT NULL,
    `operatorID` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `games_resources_values` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `game_id` VARCHAR(255) NOT NULL,
    `game_resources_field_id` BIGINT UNSIGNED NOT NULL,
    `language` VARCHAR(255) NULL,
    `field_value` TEXT NULL,

    INDEX `game_resource_values_field_fk`(`game_resources_field_id`),
    INDEX `idx_game_id`(`game_id`),
    UNIQUE INDEX `game_resource_values_unique`(`game_id`, `game_resources_field_id`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `games_resources_values` ADD CONSTRAINT `games_resources_values_game_resources_field_id_fkey` FOREIGN KEY (`game_resources_field_id`) REFERENCES `game_resource_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
