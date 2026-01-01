CREATE TABLE `admin_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_email` varchar(255) NOT NULL,
	`action_type` enum('credit_add','credit_remove','view_players','view_transactions') NOT NULL,
	`target_player_id` int,
	`amount` int,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `type` enum('purchase','admin_add','admin_remove','game_win','game_loss','game_refund','wager_locked','wager_returned','cashout_pending','cashout_completed','cashout_failed') NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_actions` ADD CONSTRAINT `admin_actions_target_player_id_players_id_fk` FOREIGN KEY (`target_player_id`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;