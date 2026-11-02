-- CreateTable
CREATE TABLE `operator_disabled_games` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `operator_id` VARCHAR(255) NOT NULL,
    `env` VARCHAR(255) NOT NULL,
    `game_id` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `operator_active_games_unique`(`operator_id`, `env`, `game_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
