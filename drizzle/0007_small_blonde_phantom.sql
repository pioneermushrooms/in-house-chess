CREATE TABLE `syncedSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`playerId` int NOT NULL,
	`credits` int NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `syncedSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `syncedSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
ALTER TABLE `syncedSessions` ADD CONSTRAINT `syncedSessions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;