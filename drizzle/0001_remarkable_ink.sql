CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`referral_code` varchar(20) NOT NULL,
	`total_referrals` int NOT NULL DEFAULT 0,
	`total_commissions` int NOT NULL DEFAULT 0,
	`commission_rate` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `affiliates_referral_code_unique` UNIQUE(`referral_code`)
);
--> statement-breakpoint
CREATE TABLE `investment_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`min_amount` int NOT NULL,
	`max_amount` int NOT NULL,
	`daily_return_percentage` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investment_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`amount` int NOT NULL,
	`accumulated_returns` int NOT NULL DEFAULT 0,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('deposit','withdrawal','earnings','commission','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`read` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_id` int NOT NULL,
	`referred_id` int NOT NULL,
	`deposit_amount` int NOT NULL,
	`commission_earned` int NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('deposit','withdrawal','earnings','commission') NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`mercado_pago_id` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`available_balance` int NOT NULL DEFAULT 0,
	`invested_amount` int NOT NULL DEFAULT 0,
	`total_earnings` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_balances_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawal_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','approved','rejected','processed','failed') NOT NULL DEFAULT 'pending',
	`bank_data` text,
	`mercado_pago_id` varchar(255),
	`rejection_reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `withdrawal_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investments` ADD CONSTRAINT `investments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `investments` ADD CONSTRAINT `investments_plan_id_investment_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `investment_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrer_id_users_id_fk` FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referred_id_users_id_fk` FOREIGN KEY (`referred_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_balances` ADD CONSTRAINT `user_balances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;