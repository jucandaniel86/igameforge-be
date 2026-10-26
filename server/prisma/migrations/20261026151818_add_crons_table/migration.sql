-- CreateTable
CREATE TABLE `crons` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `added_at` DATETIME(0) NOT NULL,
    `cron_type` ENUM('exchange', 'forge_api') NOT NULL,
    `total_inserted` INTEGER NULL DEFAULT 0,
    `total_updated` INTEGER NULL DEFAULT 0,
    `success` TINYINT NULL,
    `details` LONGTEXT NULL,
    `env` ENUM('dev', 'uat', 'prod', 'prng') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
