/*
  Warnings:

  - You are about to alter the column `field_id` on the `game_resources` table. The data in that column could be lost. The data in that column will be cast from `Int` to `UnsignedBigInt`.

*/
-- AlterTable
ALTER TABLE `game_resources` MODIFY `field_id` BIGINT UNSIGNED NOT NULL;

-- AddForeignKey
ALTER TABLE `game_resources` ADD CONSTRAINT `game_resources_field_id_fkey` FOREIGN KEY (`field_id`) REFERENCES `game_operator_fields`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
