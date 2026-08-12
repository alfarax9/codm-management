CREATE TYPE "public"."assignment_scope" AS ENUM('scrim', 'week');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('pending', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."class_role" AS ENUM('AR', 'SMG', 'LMG', 'Shotgun', 'Marksman', 'Sniper');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('none', 'pending', 'review', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."game_result" AS ENUM('win', 'loss', 'tie');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('id', 'en');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'coach', 'analyst', 'player', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."perk_slot" AS ENUM('red', 'green', 'blue');--> statement-breakpoint
CREATE TYPE "public"."restriction_mode" AS ENUM('ban', 'allow');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('human', 'ai');--> statement-breakpoint
CREATE TYPE "public"."round_side" AS ENUM('atk', 'def');--> statement-breakpoint
CREATE TYPE "public"."rule_category" AS ENUM('weapon', 'attachment', 'perk', 'lethal', 'tactical', 'operator_skill', 'scorestreak', 'wildcard', 'cosmetic', 'gameplay_setting', 'map_pool', 'class_role', 'custom');--> statement-breakpoint
CREATE TYPE "public"."ruleset_source_type" AS ENUM('image', 'pdf', 'manual');--> statement-breakpoint
CREATE TYPE "public"."ruleset_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."scrim_status" AS ENUM('scheduled', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."side" AS ENUM('us', 'them');--> statement-breakpoint
CREATE TYPE "public"."snd_ended_by" AS ENUM('elimination', 'bomb_exploded', 'bomb_defused', 'time_expired');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('captain', 'player', 'analyst', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."utility_type" AS ENUM('lethal', 'tactical');--> statement-breakpoint
CREATE TYPE "public"."weapon_class" AS ENUM('AR', 'SMG', 'LMG', 'Shotgun', 'Marksman', 'Sniper', 'Pistol', 'Launcher', 'Melee');--> statement-breakpoint
CREATE TABLE "analyst_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"analyst_id" uuid NOT NULL,
	"scope" "assignment_scope" NOT NULL,
	"scrim_id" uuid,
	"week_id" uuid,
	"player_id" uuid,
	"status" "assignment_status" DEFAULT 'pending' NOT NULL,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"scrim_game_id" uuid,
	"ratings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"strengths" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"weaknesses" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"notes" text,
	"source" "review_source" DEFAULT 'human' NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"week_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"metrics" jsonb NOT NULL,
	"deltas" jsonb,
	"grade" text,
	"summary" text,
	"summary_source" "review_source",
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"label" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"weapon_id" uuid,
	"slot" text,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_modes" (
	"map_id" uuid NOT NULL,
	"mode_id" uuid NOT NULL,
	CONSTRAINT "map_modes_map_id_mode_id_pk" PRIMARY KEY("map_id","mode_id")
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"minimap_url" text,
	"is_official" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"obj_time_label_key" text,
	"stat_columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "modes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "operator_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slot" "perk_slot" NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorestreaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cost" integer
);
--> statement-breakpoint
CREATE TABLE "series_formats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text,
	"mode_quota" jsonb NOT NULL,
	"games_count" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "utility_type" NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weapons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"class" "weapon_class" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_role_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"roles" "class_role"[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loadouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"scrim_id" uuid,
	"name" text NOT NULL,
	"weapon_id" uuid,
	"attachment_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"perk_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"lethal_id" uuid,
	"tactical_id" uuid,
	"operator_skill_id" uuid,
	"scorestreak_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"team_id" uuid,
	"email" text NOT NULL,
	"org_role" "org_role" DEFAULT 'viewer' NOT NULL,
	"team_role" "team_role",
	"token" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"ign" text NOT NULL,
	"aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"uid" text,
	"avatar_url" text,
	"primary_roles" "class_role"[] DEFAULT ARRAY[]::class_role[] NOT NULL,
	"is_substitute" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"preferred_locale" "locale" DEFAULT 'id' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role" DEFAULT 'player' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tag" text,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruleset_map_pool" (
	"ruleset_id" uuid NOT NULL,
	"mode_id" uuid NOT NULL,
	"map_id" uuid NOT NULL,
	CONSTRAINT "ruleset_map_pool_ruleset_id_mode_id_map_id_pk" PRIMARY KEY("ruleset_id","mode_id","map_id")
);
--> statement-breakpoint
CREATE TABLE "ruleset_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleset_id" uuid NOT NULL,
	"category" "rule_category" NOT NULL,
	"restriction" "restriction_mode" DEFAULT 'ban' NOT NULL,
	"item_key" text NOT NULL,
	"item_label" text NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"value" jsonb,
	"note" text,
	"needs_review" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rulesets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"source_file_url" text,
	"source_type" "ruleset_source_type" DEFAULT 'manual' NOT NULL,
	"parsed_raw" jsonb,
	"status" "ruleset_status" DEFAULT 'draft' NOT NULL,
	"effective_from" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_game_id" uuid NOT NULL,
	"round_no" integer NOT NULL,
	"side" "round_side",
	"result" "game_result" NOT NULL,
	"our_tickets" integer,
	"their_tickets" integer,
	"objectives_captured" integer
);
--> statement-breakpoint
CREATE TABLE "game_player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_game_id" uuid NOT NULL,
	"side" "side" DEFAULT 'us' NOT NULL,
	"player_id" uuid,
	"opponent_player_id" uuid,
	"ign" text NOT NULL,
	"placement" integer,
	"score" integer DEFAULT 0 NOT NULL,
	"kills" integer DEFAULT 0 NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"obj_time_seconds" integer DEFAULT 0 NOT NULL,
	"impact" integer DEFAULT 0 NOT NULL,
	"is_mvp" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hp_hills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_game_id" uuid NOT NULL,
	"hill_no" integer NOT NULL,
	"hill_name" text,
	"our_time_seconds" integer DEFAULT 0 NOT NULL,
	"their_time_seconds" integer DEFAULT 0 NOT NULL,
	"our_score_after" integer,
	"their_score_after" integer
);
--> statement-breakpoint
CREATE TABLE "opponent_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opponent_id" uuid NOT NULL,
	"ign" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opponents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tag" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrim_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_id" uuid NOT NULL,
	"game_no" integer NOT NULL,
	"mode_id" uuid,
	"map_id" uuid,
	"result" "game_result",
	"our_score" integer,
	"their_score" integer,
	"played_at" timestamp with time zone,
	"team_kd_ratio" numeric(5, 2),
	"team_accuracy" numeric(5, 2),
	"team_headshot_pct" numeric(5, 2),
	"screenshot_url" text,
	"extraction_status" "extraction_status" DEFAULT 'none' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"opponent_id" uuid,
	"series_format_id" uuid NOT NULL,
	"ruleset_id" uuid,
	"week_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "scrim_status" DEFAULT 'scheduled' NOT NULL,
	"our_wins" integer DEFAULT 0 NOT NULL,
	"their_wins" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snd_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_game_id" uuid NOT NULL,
	"round_no" integer NOT NULL,
	"result" "game_result" NOT NULL,
	"ended_by" "snd_ended_by",
	"side" "round_side",
	"our_score" integer DEFAULT 0 NOT NULL,
	"their_score" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyst_assignments" ADD CONSTRAINT "analyst_assignments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_assignments" ADD CONSTRAINT "analyst_assignments_analyst_id_profiles_id_fk" FOREIGN KEY ("analyst_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_assignments" ADD CONSTRAINT "analyst_assignments_scrim_id_scrims_id_fk" FOREIGN KEY ("scrim_id") REFERENCES "public"."scrims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_assignments" ADD CONSTRAINT "analyst_assignments_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_assignments" ADD CONSTRAINT "analyst_assignments_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_assignments" ADD CONSTRAINT "analyst_assignments_assigned_by_profiles_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_reviews" ADD CONSTRAINT "player_reviews_assignment_id_analyst_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."analyst_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_reviews" ADD CONSTRAINT "player_reviews_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_reviews" ADD CONSTRAINT "player_reviews_scrim_game_id_scrim_games_id_fk" FOREIGN KEY ("scrim_game_id") REFERENCES "public"."scrim_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_reviews" ADD CONSTRAINT "player_reviews_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_weapon_id_weapons_id_fk" FOREIGN KEY ("weapon_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_modes" ADD CONSTRAINT "map_modes_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_modes" ADD CONSTRAINT "map_modes_mode_id_modes_id_fk" FOREIGN KEY ("mode_id") REFERENCES "public"."modes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_skills" ADD CONSTRAINT "operator_skills_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perks" ADD CONSTRAINT "perks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorestreaks" ADD CONSTRAINT "scorestreaks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_formats" ADD CONSTRAINT "series_formats_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_formats" ADD CONSTRAINT "series_formats_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utilities" ADD CONSTRAINT "utilities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weapons" ADD CONSTRAINT "weapons_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_role_claims" ADD CONSTRAINT "class_role_claims_scrim_id_scrims_id_fk" FOREIGN KEY ("scrim_id") REFERENCES "public"."scrims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_role_claims" ADD CONSTRAINT "class_role_claims_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_scrim_id_scrims_id_fk" FOREIGN KEY ("scrim_id") REFERENCES "public"."scrims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_weapon_id_weapons_id_fk" FOREIGN KEY ("weapon_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_operator_skill_id_operator_skills_id_fk" FOREIGN KEY ("operator_skill_id") REFERENCES "public"."operator_skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loadouts" ADD CONSTRAINT "loadouts_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruleset_map_pool" ADD CONSTRAINT "ruleset_map_pool_ruleset_id_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."rulesets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruleset_map_pool" ADD CONSTRAINT "ruleset_map_pool_mode_id_modes_id_fk" FOREIGN KEY ("mode_id") REFERENCES "public"."modes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruleset_map_pool" ADD CONSTRAINT "ruleset_map_pool_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruleset_rules" ADD CONSTRAINT "ruleset_rules_ruleset_id_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."rulesets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rulesets" ADD CONSTRAINT "rulesets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rulesets" ADD CONSTRAINT "rulesets_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_rounds" ADD CONSTRAINT "ctrl_rounds_scrim_game_id_scrim_games_id_fk" FOREIGN KEY ("scrim_game_id") REFERENCES "public"."scrim_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_scrim_game_id_scrim_games_id_fk" FOREIGN KEY ("scrim_game_id") REFERENCES "public"."scrim_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_opponent_player_id_opponent_players_id_fk" FOREIGN KEY ("opponent_player_id") REFERENCES "public"."opponent_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hp_hills" ADD CONSTRAINT "hp_hills_scrim_game_id_scrim_games_id_fk" FOREIGN KEY ("scrim_game_id") REFERENCES "public"."scrim_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opponent_players" ADD CONSTRAINT "opponent_players_opponent_id_opponents_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."opponents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_games" ADD CONSTRAINT "scrim_games_scrim_id_scrims_id_fk" FOREIGN KEY ("scrim_id") REFERENCES "public"."scrims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_games" ADD CONSTRAINT "scrim_games_mode_id_modes_id_fk" FOREIGN KEY ("mode_id") REFERENCES "public"."modes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_games" ADD CONSTRAINT "scrim_games_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_opponent_id_opponents_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."opponents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_series_format_id_series_formats_id_fk" FOREIGN KEY ("series_format_id") REFERENCES "public"."series_formats"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_ruleset_id_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."rulesets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snd_rounds" ADD CONSTRAINT "snd_rounds_scrim_game_id_scrim_games_id_fk" FOREIGN KEY ("scrim_game_id") REFERENCES "public"."scrim_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyst_assignments_analyst_idx" ON "analyst_assignments" USING btree ("analyst_id","status");--> statement-breakpoint
CREATE INDEX "analyst_assignments_scrim_idx" ON "analyst_assignments" USING btree ("scrim_id");--> statement-breakpoint
CREATE INDEX "analyst_assignments_week_idx" ON "analyst_assignments" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "player_reviews_player_idx" ON "player_reviews" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_reports_week_player_idx" ON "weekly_reports" USING btree ("week_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weeks_org_start_idx" ON "weeks" USING btree ("org_id","start_date");--> statement-breakpoint
CREATE INDEX "attachments_org_weapon_idx" ON "attachments" USING btree ("org_id","weapon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "maps_org_slug_idx" ON "maps" USING btree ("org_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "operator_skills_org_name_idx" ON "operator_skills" USING btree ("org_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "perks_org_slot_name_idx" ON "perks" USING btree ("org_id","slot","name");--> statement-breakpoint
CREATE UNIQUE INDEX "scorestreaks_org_name_idx" ON "scorestreaks" USING btree ("org_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "series_formats_org_code_idx" ON "series_formats" USING btree ("org_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "utilities_org_type_name_idx" ON "utilities" USING btree ("org_id","type","name");--> statement-breakpoint
CREATE UNIQUE INDEX "weapons_org_name_idx" ON "weapons" USING btree ("org_id","name");--> statement-breakpoint
CREATE INDEX "weapons_class_idx" ON "weapons" USING btree ("org_id","class");--> statement-breakpoint
CREATE UNIQUE INDEX "class_role_claims_scrim_player_idx" ON "class_role_claims" USING btree ("scrim_id","player_id");--> statement-breakpoint
CREATE INDEX "loadouts_player_scrim_idx" ON "loadouts" USING btree ("player_id","scrim_id");--> statement-breakpoint
CREATE INDEX "invitations_org_email_idx" ON "invitations" USING btree ("org_id","email");--> statement-breakpoint
CREATE INDEX "org_members_user_idx" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "players_team_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_team_ign_idx" ON "players" USING btree ("team_id","ign");--> statement-breakpoint
CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_org_idx" ON "teams" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ruleset_rules_lookup_idx" ON "ruleset_rules" USING btree ("ruleset_id","category","item_key");--> statement-breakpoint
CREATE INDEX "ruleset_rules_review_idx" ON "ruleset_rules" USING btree ("ruleset_id","needs_review");--> statement-breakpoint
CREATE INDEX "rulesets_org_status_idx" ON "rulesets" USING btree ("org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ctrl_rounds_game_no_idx" ON "ctrl_rounds" USING btree ("scrim_game_id","round_no");--> statement-breakpoint
CREATE INDEX "game_player_stats_game_idx" ON "game_player_stats" USING btree ("scrim_game_id");--> statement-breakpoint
CREATE INDEX "game_player_stats_player_idx" ON "game_player_stats" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hp_hills_game_no_idx" ON "hp_hills" USING btree ("scrim_game_id","hill_no");--> statement-breakpoint
CREATE UNIQUE INDEX "opponent_players_ign_idx" ON "opponent_players" USING btree ("opponent_id","ign");--> statement-breakpoint
CREATE UNIQUE INDEX "opponents_org_name_idx" ON "opponents" USING btree ("org_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "scrim_games_scrim_no_idx" ON "scrim_games" USING btree ("scrim_id","game_no");--> statement-breakpoint
CREATE INDEX "scrim_games_map_mode_idx" ON "scrim_games" USING btree ("map_id","mode_id");--> statement-breakpoint
CREATE INDEX "scrims_team_date_idx" ON "scrims" USING btree ("team_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "scrims_week_idx" ON "scrims" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "scrims_opponent_idx" ON "scrims" USING btree ("opponent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "snd_rounds_game_no_idx" ON "snd_rounds" USING btree ("scrim_game_id","round_no");