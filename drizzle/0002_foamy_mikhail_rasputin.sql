CREATE TABLE `student_ai_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_ai_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_ai_chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studentName` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`class` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_ai_chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studentName` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`class` varchar(100) NOT NULL,
	`totalScore` int,
	`longRunScore` int,
	`swimmingScore` int,
	`ballScore` int,
	`ballType` varchar(100),
	`elective1` varchar(100),
	`elective1Score` int,
	`elective2` varchar(100),
	`elective2Score` int,
	`gender` varchar(10),
	`recordDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_score_history_id` PRIMARY KEY(`id`)
);
