-- Existing users keep a NULL role until one is explicitly assigned.
ALTER TABLE `users`
    ADD COLUMN `role_id` BIGINT UNSIGNED NULL,
    ADD INDEX `users_role_id_idx` (`role_id`),
    ADD CONSTRAINT `users_role_id_fkey`
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;
