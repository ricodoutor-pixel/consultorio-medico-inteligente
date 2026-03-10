CREATE TABLE `conversation_history` (
	`id` varchar(100) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_history_id` PRIMARY KEY(`id`)
);
