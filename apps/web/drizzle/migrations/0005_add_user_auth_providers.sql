-- Add created_at and updated_at columns to users table
ALTER TABLE `users` ADD `created_at` integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint

-- Create user_auth_providers table for external auth provider links
CREATE TABLE `user_auth_providers` (
	`id` blob PRIMARY KEY NOT NULL,
	`user_id` blob NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`email` text,
	`provider_data` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint

-- Create unique constraint and index
CREATE UNIQUE INDEX `user_auth_providers_provider_provider_id_unique` ON `user_auth_providers` (`provider`,`provider_id`);--> statement-breakpoint
CREATE INDEX `user_auth_providers_user_id_idx` ON `user_auth_providers` (`user_id`);
