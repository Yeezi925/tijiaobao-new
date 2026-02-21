CREATE TABLE `curriculum_standards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curriculum_standards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_lesson_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`teachingObjectives` text,
	`keyPoints` text,
	`teachingProcess` text,
	`summary` text,
	`reflection` text,
	`homework` text,
	`fullContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_lesson_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_plan_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_plan_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_plan_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`standardId` int,
	`templateId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_plan_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`fileUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_templates_id` PRIMARY KEY(`id`)
);
