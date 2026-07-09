CREATE TABLE IF NOT EXISTS `screening_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `nominations` ADD COLUMN `normalized_title` text;
--> statement-breakpoint
UPDATE `nominations`
SET `normalized_title` = lower(replace(replace(replace(trim(`title`), ' ', ''), char(9), ''), char(10), ''))
WHERE `normalized_title` IS NULL OR `normalized_title` = '';
--> statement-breakpoint
DELETE FROM `nominations`
WHERE rowid NOT IN (
	SELECT min(rowid)
	FROM `nominations`
	GROUP BY `normalized_title`
);
--> statement-breakpoint
DELETE FROM `nominations`
WHERE rowid NOT IN (
	SELECT min(rowid)
	FROM `nominations`
	GROUP BY `nominated_by_id`
);
--> statement-breakpoint
DELETE FROM `votes`
WHERE `nomination_id` NOT IN (
	SELECT `id`
	FROM `nominations`
);
--> statement-breakpoint
DELETE FROM `votes`
WHERE rowid NOT IN (
	SELECT min(rowid)
	FROM `votes`
	GROUP BY `user_id`
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nominations_normalized_title_unique` ON `nominations` (`normalized_title`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nominations_nominated_by_id_unique` ON `nominations` (`nominated_by_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `nominations_type_idx` ON `nominations` (`type`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `votes_user_id_unique` ON `votes` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `votes_nomination_id_idx` ON `votes` (`nomination_id`);
