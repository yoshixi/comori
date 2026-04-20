-- Migrate todos, posts, notes from text UUID primary keys to integer AUTOINCREMENT.
-- Junction rows are remapped via temporary mapping tables. Description on todos is
-- re-inserted as NULL when absent from the source row (push DBs with description
-- data may need to restore from backup if that matters).
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `_post_events_backup` AS SELECT * FROM `post_events`;--> statement-breakpoint
CREATE TABLE `_post_todos_backup` AS SELECT * FROM `post_todos`;--> statement-breakpoint
DROP TABLE `post_events`;--> statement-breakpoint
DROP TABLE `post_todos`;--> statement-breakpoint
ALTER TABLE `todos` RENAME TO `todos_old`;--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`starts_at` integer,
	`ends_at` integer,
	`is_all_day` integer DEFAULT 0 NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`done_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `todos` (`user_id`, `title`, `description`, `starts_at`, `ends_at`, `is_all_day`, `done`, `done_at`, `created_at`)
SELECT `user_id`, `title`, NULL, `starts_at`, `ends_at`, `is_all_day`, `done`, `done_at`, `created_at` FROM `todos_old`
ORDER BY `created_at`, `id`;--> statement-breakpoint
CREATE TABLE `_todo_id_map` (
	`old_id` text PRIMARY KEY NOT NULL,
	`new_id` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `_todo_id_map` (`old_id`, `new_id`)
SELECT o.`old_id`, n.`id` FROM (
	SELECT `id` AS `old_id`, ROW_NUMBER() OVER (ORDER BY `created_at`, `id`) AS `rn` FROM `todos_old`
) o
JOIN (
	SELECT `id`, ROW_NUMBER() OVER (ORDER BY `created_at`, `id`) AS `rn` FROM `todos`
) n ON o.`rn` = n.`rn`;--> statement-breakpoint
DROP TABLE `todos_old`;--> statement-breakpoint
ALTER TABLE `posts` RENAME TO `posts_old`;--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`body` text NOT NULL,
	`posted_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `posts` (`user_id`, `body`, `posted_at`)
SELECT `user_id`, `body`, `posted_at` FROM `posts_old`
ORDER BY `posted_at`, `id`;--> statement-breakpoint
CREATE TABLE `_post_id_map` (
	`old_id` text PRIMARY KEY NOT NULL,
	`new_id` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `_post_id_map` (`old_id`, `new_id`)
SELECT o.`old_id`, n.`id` FROM (
	SELECT `id` AS `old_id`, ROW_NUMBER() OVER (ORDER BY `posted_at`, `id`) AS `rn` FROM `posts_old`
) o
JOIN (
	SELECT `id`, ROW_NUMBER() OVER (ORDER BY `posted_at`, `id`) AS `rn` FROM `posts`
) n ON o.`rn` = n.`rn`;--> statement-breakpoint
DROP TABLE `posts_old`;--> statement-breakpoint
ALTER TABLE `notes` RENAME TO `notes_old`;--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`pinned` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `notes` (`user_id`, `title`, `body`, `pinned`, `created_at`, `updated_at`)
SELECT `user_id`, `title`, `body`, `pinned`, `created_at`, `updated_at` FROM `notes_old`
ORDER BY `updated_at`, `id`;--> statement-breakpoint
DROP TABLE `notes_old`;--> statement-breakpoint
CREATE TABLE `post_events` (
	`post_id` integer NOT NULL,
	`event_id` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `post_events` (`post_id`, `event_id`)
SELECT pm.`new_id`, b.`event_id` FROM `_post_events_backup` b
INNER JOIN `_post_id_map` pm ON b.`post_id` = pm.`old_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `post_events_post_id_event_id_unique` ON `post_events` (`post_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `post_todos` (
	`post_id` integer NOT NULL,
	`todo_id` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `post_todos` (`post_id`, `todo_id`)
SELECT pm.`new_id`, tm.`new_id` FROM `_post_todos_backup` b
INNER JOIN `_post_id_map` pm ON b.`post_id` = pm.`old_id`
INNER JOIN `_todo_id_map` tm ON b.`todo_id` = tm.`old_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `post_todos_post_id_todo_id_unique` ON `post_todos` (`post_id`,`todo_id`);--> statement-breakpoint
DROP TABLE `_post_events_backup`;--> statement-breakpoint
DROP TABLE `_post_todos_backup`;--> statement-breakpoint
DROP TABLE `_todo_id_map`;--> statement-breakpoint
DROP TABLE `_post_id_map`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `todos_starts_at_idx` ON `todos` (`starts_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `todos_user_id_done_idx` ON `todos` (`user_id`,`done`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `posts_posted_at_idx` ON `posts` (`posted_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notes_user_id_idx` ON `notes` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notes_updated_at_idx` ON `notes` (`updated_at`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
