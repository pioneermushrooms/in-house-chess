ALTER TABLE `games` ADD `isComputerGame` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `computerDifficulty` enum('easy','medium','hard');