/*
  Warnings:

  - A unique constraint covering the columns `[site_id,brand_id,game_id,env]` on the table `games` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `roles` MODIFY `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0);

-- CreateIndex
CREATE INDEX `games_dedupe_idx` ON `games`(`site_id`, `brand_id`, `game_id`, `env`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `games_site_brand_game_env_unique` ON `games`(`site_id`, `brand_id`, `game_id`, `env`);
