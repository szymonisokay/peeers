ALTER TABLE `events` ADD `list_id` text;--> statement-breakpoint
CREATE INDEX `events_list_created_idx` ON `events` (`list_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `lists` ADD `archived_reason` text;