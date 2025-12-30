CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteCode` varchar(16),
	`whitePlayerId` int,
	`blackPlayerId` int,
	`timeControl` varchar(16) NOT NULL,
	`initialTime` int NOT NULL,
	`increment` int NOT NULL,
	`currentFen` text NOT NULL,
	`moveList` text NOT NULL,
	`status` enum('waiting','active','completed','abandoned') NOT NULL DEFAULT 'waiting',
	`result` enum('white_win','black_win','draw','abandoned'),
	`endReason` varchar(64),
	`whiteTimeRemaining` int,
	`blackTimeRemaining` int,
	`lastMoveAt` timestamp,
	`isRated` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`endedAt` timestamp,
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `matchmakingQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`timeControl` varchar(16) NOT NULL,
	`rating` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchmakingQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alias` varchar(64) NOT NULL,
	`rating` int NOT NULL DEFAULT 1200,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`draws` int NOT NULL DEFAULT 0,
	`gamesPlayed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_alias_unique` UNIQUE(`alias`)
);
--> statement-breakpoint
CREATE TABLE `ratingChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`playerId` int NOT NULL,
	`oldRating` int NOT NULL,
	`newRating` int NOT NULL,
	`delta` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratingChanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_whitePlayerId_players_id_fk` FOREIGN KEY (`whitePlayerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_blackPlayerId_players_id_fk` FOREIGN KEY (`blackPlayerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchmakingQueue` ADD CONSTRAINT `matchmakingQueue_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratingChanges` ADD CONSTRAINT `ratingChanges_gameId_games_id_fk` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratingChanges` ADD CONSTRAINT `ratingChanges_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;