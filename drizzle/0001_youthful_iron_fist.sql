CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`referralLink` varchar(255) NOT NULL,
	`parentAffiliateId` int,
	`level` int DEFAULT 1,
	`totalReferrals` int DEFAULT 0,
	`totalCommissions` decimal(12,2) DEFAULT '0',
	`withdrawnAmount` decimal(12,2) DEFAULT '0',
	`pendingAmount` decimal(12,2) DEFAULT '0',
	`status` enum('active','inactive','suspended') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `affiliates_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `anvisa_validations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`receiptImageUrl` varchar(255),
	`ocrText` text,
	`doctorName` varchar(255),
	`doctorCRM` varchar(50),
	`crmValidated` boolean DEFAULT false,
	`productCompliance` boolean DEFAULT false,
	`validationStatus` enum('pending','approved','rejected','manual_review') DEFAULT 'pending',
	`validationDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anvisa_validations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brisa_triages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symptoms` text,
	`medicalHistory` text,
	`location` varchar(255),
	`matchedDoctors` json,
	`recommendedProducts` json,
	`triageDate` timestamp NOT NULL DEFAULT (now()),
	`followUpDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brisa_triages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`level` int NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`transactionAmount` decimal(12,2) NOT NULL,
	`commissionAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','approved','paid','cancelled') DEFAULT 'pending',
	`transactionDate` timestamp NOT NULL DEFAULT (now()),
	`paidDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saas_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`description` text,
	`benefits` json NOT NULL,
	`taxFreeCheckout` boolean DEFAULT false,
	`withdrawalTaxExemption` boolean DEFAULT false,
	`maxProfiles` int DEFAULT 1,
	`verificationBadge` boolean DEFAULT false,
	`recommendationHighlight` boolean DEFAULT false,
	`consultationRevenueSplit` decimal(5,2) DEFAULT '0',
	`bannerAdvertising` boolean DEFAULT false,
	`marketReports` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saas_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `saas_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `smart_refills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(100) NOT NULL,
	`medicationName` varchar(255) NOT NULL,
	`dosage` varchar(100),
	`frequency` varchar(100),
	`lastRefillDate` timestamp,
	`nextRefillDate` timestamp,
	`autoRefillEnabled` boolean DEFAULT true,
	`refillDaysBeforeExpiry` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smart_refills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','paused','cancelled','expired') DEFAULT 'active',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`renewalDate` timestamp,
	`paymentMethodId` varchar(100),
	`autoRenew` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('technical','billing','account','product','logistics','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('open','in_progress','waiting_user','resolved','closed') DEFAULT 'open',
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('subscription','commission','withdrawal','refund','admin_fee') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`fee` decimal(12,2) DEFAULT '0',
	`netAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`description` text,
	`paymentMethodId` varchar(100),
	`externalTransactionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`fee` decimal(12,2) DEFAULT '0',
	`netAmount` decimal(12,2) NOT NULL,
	`bankAccount` json,
	`status` enum('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
	`requestDate` timestamp NOT NULL DEFAULT (now()),
	`completedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','doctor','store','affiliate','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('individual','clinic','pharmacy','partner') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationCode` varchar(6);--> statement-breakpoint
ALTER TABLE `users` ADD `verificationCodeExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `profileComplete` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);