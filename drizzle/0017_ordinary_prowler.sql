CREATE TABLE `nominations` (
	`id` text PRIMARY KEY NOT NULL,
	`screening_id` text,
	`title` text NOT NULL,
	`cover` text,
	`type` text DEFAULT 'anime' NOT NULL,
	`nominated_by_id` text NOT NULL,
	`nominated_by_name` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`screening_id` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `screenings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`bilibili_bvid` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`anime_title` text NOT NULL,
	`anime_cover` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`nomination_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
