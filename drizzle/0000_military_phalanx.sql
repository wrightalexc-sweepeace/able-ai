CREATE TYPE "public"."active_role_context_enum" AS ENUM('BUYER', 'GIG_WORKER');--> statement-breakpoint
CREATE TYPE "public"."badge_type_enum" AS ENUM('COMMON', 'EARLY_JOINER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."cancellation_party_enum" AS ENUM('BUYER', 'WORKER', 'ADMIN', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."discount_type_enum" AS ENUM('USER_REFERRAL', 'PLATFORM_DISCOUNT', 'ONE_TIME_DISCOUNT');--> statement-breakpoint
CREATE TYPE "public"."gig_amendment_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."gig_status_enum" AS ENUM('PENDING_WORKER_ACCEPTANCE', 'PAYMENT_HELD_PENDING_ACCEPTANCE', 'ACCEPTED', 'DECLINED_BY_WORKER', 'IN_PROGRESS', 'PENDING_COMPLETION_WORKER', 'PENDING_COMPLETION_BUYER', 'COMPLETED', 'AWAITING_PAYMENT', 'PAID', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."moderation_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'AUTO_FLAGGED');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'REQUIRES_ACTION');--> statement-breakpoint
CREATE TYPE "public"."review_type_enum" AS ENUM('INTERNAL_PLATFORM', 'EXTERNAL_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."rtw_kyc_status_enum" AS ENUM('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'ACCEPTED', 'EXPIRED', 'NOT_FOUND', 'LOCKED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."stripe_account_status_enum" AS ENUM('connected', 'pending_verification', 'incomplete', 'restricted', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."user_app_role_enum" AS ENUM('USER', 'SUPER_ADMIN', 'ADMIN', 'QA');--> statement-breakpoint
CREATE TYPE "public"."vector_entity_type_enum" AS ENUM('WORKER_PROFILE_BIO', 'WORKER_SKILL_DESCRIPTION', 'GIG_REQUIREMENT_DESCRIPTION', 'USER_REVIEW_TEXT');--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"action" varchar(255) NOT NULL,
	"target_entity_type" varchar(100),
	"target_entity_id" varchar(255),
	"details_json" jsonb,
	"ip_address" varchar(45),
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_key" varchar(100) NOT NULL,
	"prompt_text" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "ai_prompts_prompt_key_unique" UNIQUE("prompt_key")
);
--> statement-breakpoint
CREATE TABLE "escalated_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"firestore_message_id" varchar(255),
	"gig_id" varchar(255),
	"issue_type" varchar(100),
	"description" text,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"admin_user_id" uuid,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_flags" (
	"flag_key" varchar(255) NOT NULL,
	"flag_value" jsonb NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_flags_flag_key_unique" UNIQUE("flag_key")
);
--> statement-breakpoint
CREATE TABLE "user_ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"ai_message_count" integer DEFAULT 0 NOT NULL,
	"last_interaction_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"days" jsonb,
	"frequency" varchar(50),
	"start_date" varchar(50),
	"start_time_str" varchar(10),
	"end_time_str" varchar(10),
	"ends" varchar(50),
	"occurrences" integer,
	"end_date" varchar(50),
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_verified_by_admin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_amendment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb NOT NULL,
	"status" "gig_amendment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"responder_notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_skills_required" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"skill_id" uuid,
	"skill_name" varchar(100) NOT NULL,
	"is_required" boolean DEFAULT true,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "gigs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"worker_user_id" uuid,
	"title_internal" varchar(255) NOT NULL,
	"full_description" text,
	"exact_location" text,
	"address_json" jsonb,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"agreed_rate" numeric(10, 2) NOT NULL,
	"estimated_hours" numeric(5, 2),
	"total_agreed_price" numeric(10, 2),
	"final_rate" numeric(10, 2),
	"final_hours" numeric(5, 2),
	"final_agreed_price" numeric(10, 2),
	"status_internal" "gig_status_enum" DEFAULT 'PENDING_WORKER_ACCEPTANCE' NOT NULL,
	"able_fee_percent" numeric(5, 4),
	"stripe_fee_percent" numeric(5, 4),
	"stripe_fee_fixed" numeric(10, 2),
	"promo_code_applied" varchar(50),
	"moderation_status" "moderation_status_enum" DEFAULT 'PENDING' NOT NULL,
	"cancellation_reason" text,
	"cancellation_party" "cancellation_party_enum",
	"notes_for_worker" text,
	"notes_for_buyer" text,
	"adjustment_notes" text,
	"adjusted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"discount_code_id" uuid
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"institution" varchar(255),
	"year_achieved" integer,
	"description" text,
	"document_url" text,
	"is_verified_by_admin" boolean DEFAULT false,
	"skill_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"experience_months" integer NOT NULL,
	"experience_years" numeric(4, 1) NOT NULL,
	"agreed_rate" numeric(10, 2) NOT NULL,
	"skill_video_url" text,
	"admin_tags" text[],
	"able_gigs" integer,
	"images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_company_name" varchar(255),
	"vat_number" varchar(50),
	"business_registration_number" varchar(100),
	"response_rate_internal" numeric(5, 2),
	"billing_address_json" jsonb,
	"video_url" text,
	"company_role" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "buyer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "gig_worker_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_bio" text,
	"location" text,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"hash_tags" jsonb,
	"private_notes" text,
	"response_rate_internal" numeric(5, 2),
	"availability_json" jsonb,
	"semantic_profile_json" jsonb,
	"video_url" text,
	"social_link" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "gig_worker_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_recovery_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "password_recovery_requests_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_profile_id" uuid NOT NULL,
	"member_user_id" uuid,
	"name" varchar(255),
	"email" varchar(255),
	"role_in_team" varchar(100),
	"permissions_json" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar(128) NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"app_role" "user_app_role_enum" DEFAULT 'USER' NOT NULL,
	"is_gig_worker" boolean DEFAULT false NOT NULL,
	"is_buyer" boolean DEFAULT false NOT NULL,
	"last_role_used" "active_role_context_enum",
	"last_view_visited_buyer" text,
	"last_view_visited_worker" text,
	"stripe_customer_id" varchar(255),
	"stripe_connect_account_id" varchar(255),
	"can_receive_payouts" boolean DEFAULT false NOT NULL,
	"stripe_account_status" "stripe_account_status_enum",
	"rtw_status" "rtw_kyc_status_enum" DEFAULT 'NOT_SUBMITTED',
	"rtw_document_url" text,
	"kyc_status" "rtw_kyc_status_enum" DEFAULT 'NOT_SUBMITTED',
	"kyc_document_url" text,
	"is_banned" boolean DEFAULT false NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"profile_visibility" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "users_stripe_connect_account_id_unique" UNIQUE("stripe_connect_account_id")
);
--> statement-breakpoint
CREATE TABLE "badge_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon_url_or_lucide_name" varchar(255),
	"type" "badge_type_enum" NOT NULL,
	"criteria_json" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "badge_definitions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"image_url" text,
	"is_read_by_receiver" boolean DEFAULT false NOT NULL,
	"moderation_status" "moderation_status_enum" DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_user_id" uuid NOT NULL,
	"recommendation_code" varchar(50) NOT NULL,
	"recommendation_text" text,
	"relationship" text,
	"recommender_name" varchar(100),
	"recommender_email" varchar(255),
	"is_verified" boolean DEFAULT false,
	"moderation_status" "moderation_status_enum" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "recommendations_recommendation_code_unique" UNIQUE("recommendation_code")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid,
	"author_user_id" uuid,
	"target_user_id" uuid NOT NULL,
	"relationship" text,
	"recommender_name" text,
	"recommender_email" text,
	"rating" integer NOT NULL,
	"comment" text,
	"would_work_again" boolean,
	"awarded_badge_names_to_target_json" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"type" "review_type_enum" DEFAULT 'INTERNAL_PLATFORM' NOT NULL,
	"moderation_status" "moderation_status_enum" DEFAULT 'PENDING' NOT NULL,
	"target_role" "active_role_context_enum",
	"skill_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"awarded_by_system" boolean DEFAULT false,
	"awarded_by_user_id" uuid,
	"gig_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_amount" numeric(10, 2),
	"discount_percentage" numeric(5, 2),
	"type" "discount_type_enum" NOT NULL,
	"user_id" uuid NOT NULL,
	"already_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "mock_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_user_id" uuid NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"scenario" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"payer_user_id" uuid NOT NULL,
	"receiver_user_id" uuid NOT NULL,
	"amount_gross" numeric(10, 2) NOT NULL,
	"able_fee_amount" numeric(10, 2) NOT NULL,
	"stripe_fee_amount" numeric(10, 2) NOT NULL,
	"amount_net_to_worker" numeric(10, 2) NOT NULL,
	"status" "payment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"stripe_transfer_id_to_worker" varchar(255),
	"stripe_payout_id_to_worker" varchar(255),
	"invoice_url" text,
	"is_testing" boolean DEFAULT false NOT NULL,
	"payment_method_details_json" jsonb,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payments_stripe_charge_id_unique" UNIQUE("stripe_charge_id")
);
--> statement-breakpoint
CREATE TABLE "vector_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" vector_entity_type_enum NOT NULL,
	"entity_postgres_id" uuid,
	"entity_firestore_id" text,
	"embedding" vector(1536) NOT NULL,
	"source_text_hash" varchar(64),
	"embedding_model_used" varchar(100) DEFAULT 'text-embedding-ada-002',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_gig_updates" boolean DEFAULT false NOT NULL,
	"email_platform_announcements" boolean DEFAULT false NOT NULL,
	"email_marketing" boolean DEFAULT false NOT NULL,
	"sms_gig_alerts" boolean DEFAULT false NOT NULL,
	"fcm_updates" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_last_updated_by_user_id_users_id_fk" FOREIGN KEY ("last_updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalated_issues" ADD CONSTRAINT "escalated_issues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalated_issues" ADD CONSTRAINT "escalated_issues_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_usage" ADD CONSTRAINT "user_ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_availability" ADD CONSTRAINT "worker_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_worker_profile_id_gig_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."gig_worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_amendment_requests" ADD CONSTRAINT "gig_amendment_requests_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_amendment_requests" ADD CONSTRAINT "gig_amendment_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_skills_required" ADD CONSTRAINT "gig_skills_required_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_skills_required" ADD CONSTRAINT "gig_skills_required_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_worker_user_id_users_id_fk" FOREIGN KEY ("worker_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_worker_profile_id_gig_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."gig_worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_worker_profile_id_gig_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."gig_worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD CONSTRAINT "gig_worker_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_recovery_requests" ADD CONSTRAINT "password_recovery_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_buyer_profile_id_buyer_profiles_id_fk" FOREIGN KEY ("buyer_profile_id") REFERENCES "public"."buyer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_member_user_id_users_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_worker_user_id_users_id_fk" FOREIGN KEY ("worker_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges_link" ADD CONSTRAINT "user_badges_link_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges_link" ADD CONSTRAINT "user_badges_link_badge_id_badge_definitions_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges_link" ADD CONSTRAINT "user_badges_link_awarded_by_user_id_users_id_fk" FOREIGN KEY ("awarded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges_link" ADD CONSTRAINT "user_badges_link_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_payments" ADD CONSTRAINT "mock_payments_worker_user_id_users_id_fk" FOREIGN KEY ("worker_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_payments" ADD CONSTRAINT "mock_payments_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiver_user_id_users_id_fk" FOREIGN KEY ("receiver_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_availability_user_time_idx" ON "worker_availability" USING btree ("user_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "worker_availability_time_range_idx" ON "worker_availability" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "worker_availability_user_pattern_idx" ON "worker_availability" USING btree ("user_id","frequency","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "gig_id_skill_name_unique_idx" ON "gig_skills_required" USING btree ("gig_id","skill_name");--> statement-breakpoint
CREATE UNIQUE INDEX "author_target_gig_unique_idx" ON "reviews" USING btree ("author_user_id","target_user_id","gig_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_badge_unique_idx" ON "user_badges_link" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE INDEX "embedding_hnsw_cosine_idx" ON "vector_embeddings" USING hnsw ("embedding" vector_cosine_ops);