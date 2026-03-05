CREATE TABLE `parent_consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentId` int NOT NULL,
	`teacherId` int NOT NULL,
	`studentId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`reply` text,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_wechat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wechatId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_wechat_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_wechat_userId_unique` UNIQUE(`userId`)
);
