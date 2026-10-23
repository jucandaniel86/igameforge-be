-- CreateTable
CREATE TABLE `game_operator_field_mappings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `operator_field_id` BIGINT UNSIGNED NOT NULL,
    `game_resource_type_id` BIGINT UNSIGNED NOT NULL,
    `extra_options` JSON NULL,

    INDEX `game_operator_field_mappings_resource_type_index`(`game_resource_type_id`),
    UNIQUE INDEX `game_operator_field_mappings_operator_unique`(`operator_field_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `game_operator_field_mappings` ADD CONSTRAINT `game_operator_field_mappings_operator_field_id_fkey` FOREIGN KEY (`operator_field_id`) REFERENCES `game_operator_fields`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_operator_field_mappings` ADD CONSTRAINT `game_operator_field_mappings_game_resource_type_id_fkey` FOREIGN KEY (`game_resource_type_id`) REFERENCES `game_resource_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
