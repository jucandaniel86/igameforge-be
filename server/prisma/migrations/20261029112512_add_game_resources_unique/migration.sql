/*
  Warnings:

  - A unique constraint covering the columns `[game_id,operator_id,field_id,language,env]` on the table `game_resources` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `game_resources_unique` ON `game_resources`(`game_id`, `operator_id`, `field_id`, `language`, `env`);
