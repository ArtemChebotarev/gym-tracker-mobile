CREATE TABLE `round_log` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`work_sec` integer NOT NULL,
	`rest_sec` integer,
	`rest_skipped` integer DEFAULT false NOT NULL,
	`completed` integer NOT NULL,
	`completed_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercise`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `round_log_exercise_completed` ON `round_log` (`exercise_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX `round_log_session_exercise` ON `round_log` (`session_exercise_id`,`round_number`);--> statement-breakpoint
ALTER TABLE `exercise` ADD `type` text DEFAULT 'strength' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercise` ADD `config` text;--> statement-breakpoint
ALTER TABLE `mesocycle` ADD `exercise_settings` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `strength_rest_timer_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `strength_rest_timer_seconds` integer DEFAULT 120 NOT NULL;