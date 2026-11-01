CREATE TABLE `preview_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`actor_id` text NOT NULL,
	`garment_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`task_id` text,
	`image_key` text,
	`error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`units` integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owner_fingerprint` ON `preview_jobs` (`owner`,`fingerprint`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`owner` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
