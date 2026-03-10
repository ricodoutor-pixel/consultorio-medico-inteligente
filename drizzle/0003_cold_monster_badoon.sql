CREATE TABLE `sentiment_stats` (
	`id` varchar(100) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`total_messages` int NOT NULL DEFAULT 0,
	`avg_sentiment_score` int NOT NULL DEFAULT 0,
	`positive_count` int NOT NULL DEFAULT 0,
	`negative_count` int NOT NULL DEFAULT 0,
	`neutral_count` int NOT NULL DEFAULT 0,
	`most_frequent_emotion` varchar(50),
	`last_analyzed_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentiment_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `sentiment_stats_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_sentiments` (
	`id` varchar(100) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`message_id` varchar(100) NOT NULL,
	`sentiment` enum('very_positive','positive','neutral','negative','very_negative') NOT NULL,
	`emotion` enum('happy','satisfied','neutral','confused','frustrated','angry','sad') NOT NULL,
	`score` int NOT NULL,
	`keywords` text,
	`message_content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sentiments_id` PRIMARY KEY(`id`)
);
