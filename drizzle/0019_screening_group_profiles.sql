CREATE TABLE `screening_group_profiles` (
	`group_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`image_key` text,
	`updated_at` integer NOT NULL
);

INSERT INTO `screening_group_profiles` (`group_id`, `title`, `subtitle`, `image_key`, `updated_at`) VALUES
	('group1', '船长一群', '稳健预测派', NULL, 1783612800000),
	('group2', '船长二群', '锋利押宝派', NULL, 1783612800000),
	('group3', '船长三群', '冷门奇袭派', NULL, 1783612800000);
