CREATE TABLE `cashoutRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`amount` int NOT NULL,
	`usdAmount` varchar(16) NOT NULL,
	`payoutMethod` varchar(255) NOT NULL,
	`payoutMethodType` enum('venmo','paypal','zelle') NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`completedBy` varchar(255),
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashoutRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `players` ADD `payoutMethod` varchar(255);--> statement-breakpoint
ALTER TABLE `players` ADD `payoutMethodType` enum('venmo','paypal','zelle');--> statement-breakpoint
ALTER TABLE `cashoutRequests` ADD CONSTRAINT `cashoutRequests_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;