ALTER TABLE `share_links` ADD `filterType` varchar(20) DEFAULT 'all';--> statement-breakpoint
ALTER TABLE `share_links` ADD `filterValue` varchar(100);--> statement-breakpoint
ALTER TABLE `share_links` ADD `queryCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `share_links` ADD `lastQueryAt` timestamp;