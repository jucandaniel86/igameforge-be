-- Rename the column without losing existing option values.
ALTER TABLE `game_resource_types`
    CHANGE COLUMN `field_options` `field_values` TEXT NULL;
