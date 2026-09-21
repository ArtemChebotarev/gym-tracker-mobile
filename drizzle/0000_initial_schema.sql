CREATE TABLE `exercise` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`source` text NOT NULL,
	`equipment` text,
	`is_hidden` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exercise_muscle_group` ON `exercise` (`muscle_group`);--> statement-breakpoint
CREATE TABLE `mesocycle` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`length_weeks` integer NOT NULL,
	`days_per_week` integer NOT NULL,
	`start_date` text,
	`status` text NOT NULL,
	`origin` text NOT NULL,
	`progression_settings` text NOT NULL,
	`body_weight` real,
	`week_plan` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mesocycle_status` ON `mesocycle` (`status`);--> statement-breakpoint
CREATE TABLE `session_exercise` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order` integer NOT NULL,
	`set_targets` text NOT NULL,
	`target_rir` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_exercise_session` ON `session_exercise` (`session_id`,`order`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`meso_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`day_number` integer NOT NULL,
	`name` text,
	`is_deload` integer NOT NULL,
	`prescription_status` text NOT NULL,
	`status` text NOT NULL,
	`source_session_id` text,
	`planned_date` text,
	`started_at` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`meso_id`) REFERENCES `mesocycle`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_meso_day_status` ON `session` (`meso_id`,`day_number`,`status`);--> statement-breakpoint
CREATE INDEX `session_status` ON `session` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_meso_week_day` ON `session` (`meso_id`,`week_number`,`day_number`);--> statement-breakpoint
CREATE TABLE `set_log` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real NOT NULL,
	`body_weight` real,
	`reps` integer NOT NULL,
	`rir` integer,
	`completed_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercise`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `set_log_exercise_completed` ON `set_log` (`exercise_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX `set_log_session_exercise` ON `set_log` (`session_exercise_id`,`set_number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`default_progression_settings` text NOT NULL,
	`weight_unit` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meso_template` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL,
	`default_length_weeks` integer NOT NULL,
	`week_plan` text NOT NULL,
	`is_hidden` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
