CREATE TABLE `wagerProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`proposerId` int NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wagerProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `type` enum('purchase','admin_add','admin_remove','game_win','game_loss','game_refund','wager_locked','wager_returned') NOT NULL;--> statement-breakpoint
ALTER TABLE `wagerProposals` ADD CONSTRAINT `wagerProposals_gameId_games_id_fk` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wagerProposals` ADD CONSTRAINT `wagerProposals_proposerId_players_id_fk` FOREIGN KEY (`proposerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;