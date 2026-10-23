-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    `env` ENUM('dev', 'uat', 'prod', 'prng') NULL DEFAULT 'dev',
    `allowed_envs` JSON NULL,
    `user_type` ENUM('admin', 'operator') NOT NULL DEFAULT 'operator',
    `site_id` VARCHAR(20) NOT NULL,
    `provider` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
