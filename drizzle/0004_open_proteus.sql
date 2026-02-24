CREATE TABLE `share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`shareCode` varchar(50) NOT NULL,
	`dataType` enum('class','student','all') NOT NULL DEFAULT 'class',
	`className` varchar(100),
	`studentId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `share_links_shareCode_unique` UNIQUE(`shareCode`)
);
--> statement-breakpoint
CREATE TABLE `student_score_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`studentName` varchar(100) NOT NULL,
	`studentId` varchar(100),
	`className` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`gender` enum('male','female'),
	`longDistance` int,
	`basketball` int,
	`volleyball` int,
	`badminton` int,
	`tabletennis` int,
	`soccerFootball` int,
	`selected1` varchar(100),
	`selected1Score` int,
	`selected2` varchar(100),
	`selected2Score` int,
	`totalScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_score_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`granteeId` int NOT NULL,
	`permissionType` enum('view','edit','delete') NOT NULL DEFAULT 'view',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('teacher','student','parent');--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `school` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `grade` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `className` varchar(100);