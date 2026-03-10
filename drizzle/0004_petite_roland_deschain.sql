CREATE TABLE `commission_ledger` (
	`id` varchar(100) NOT NULL,
	`booking_id` varchar(100) NOT NULL,
	`service_id` varchar(100) NOT NULL,
	`profession_id` varchar(64) NOT NULL,
	`total_amount` int NOT NULL,
	`platform_fee` int NOT NULL,
	`profession_fee` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`withdrawal_id` varchar(255),
	`withdrawal_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commission_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complementary_services` (
	`id` varchar(100) NOT NULL,
	`profession_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('nutrition','physiotherapy','psychology','fitness','wellness','mental_health','other') NOT NULL,
	`price` int NOT NULL,
	`duration` int NOT NULL,
	`rating` int DEFAULT 0,
	`review_count` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complementary_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profession_commission_summary` (
	`id` varchar(100) NOT NULL,
	`profession_id` varchar(64) NOT NULL,
	`total_earnings` int NOT NULL DEFAULT 0,
	`total_bookings` int NOT NULL DEFAULT 0,
	`total_completed` int NOT NULL DEFAULT 0,
	`total_cancelled` int NOT NULL DEFAULT 0,
	`pending_withdrawal` int NOT NULL DEFAULT 0,
	`last_withdrawal_date` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profession_commission_summary_id` PRIMARY KEY(`id`),
	CONSTRAINT `profession_commission_summary_profession_id_unique` UNIQUE(`profession_id`)
);
--> statement-breakpoint
CREATE TABLE `service_bookings` (
	`id` varchar(100) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`service_id` varchar(100) NOT NULL,
	`profession_id` varchar(64) NOT NULL,
	`booking_date` timestamp NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`total_price` int NOT NULL,
	`platform_fee` int NOT NULL,
	`profession_fee` int NOT NULL,
	`payment_status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`mercado_pago_id` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_reviews` (
	`id` varchar(100) NOT NULL,
	`booking_id` varchar(100) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`service_id` varchar(100) NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(255),
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commission_ledger` ADD CONSTRAINT `commission_ledger_booking_id_service_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_ledger` ADD CONSTRAINT `commission_ledger_service_id_complementary_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `complementary_services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_ledger` ADD CONSTRAINT `commission_ledger_profession_id_users_openId_fk` FOREIGN KEY (`profession_id`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complementary_services` ADD CONSTRAINT `complementary_services_profession_id_users_openId_fk` FOREIGN KEY (`profession_id`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profession_commission_summary` ADD CONSTRAINT `profession_commission_summary_profession_id_users_openId_fk` FOREIGN KEY (`profession_id`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_user_id_users_openId_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_service_id_complementary_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `complementary_services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_profession_id_users_openId_fk` FOREIGN KEY (`profession_id`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_booking_id_service_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_user_id_users_openId_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_service_id_complementary_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `complementary_services`(`id`) ON DELETE no action ON UPDATE no action;