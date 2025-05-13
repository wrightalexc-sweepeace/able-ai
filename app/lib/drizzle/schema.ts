import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    integer,
    decimal,
    jsonb,
    primaryKey,
    serial, // For auto-incrementing integer PK if preferred over UUID for some tables
    pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role_enum', ['GIG_WORKER', 'BUYER', 'SUPER_ADMIN', 'ADMIN', 'QA']);
export const rtwKycStatusEnum = pgEnum('rtw_kyc_status_enum', ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_APPLICABLE']);
export const gigStatusEnum = pgEnum('gig_status_enum', ['PENDING_WORKER_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_COMPLETION', 'COMPLETED', 'CANCELLED', 'AWAITING_PAYMENT']); // Added AWAITING_PAYMENT
export const paymentStatusEnum = pgEnum('payment_status_enum', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']);
export const badgeTypeEnum = pgEnum('badge_type_enum', ['SKILL', 'VALUE', 'PLATFORM_ACHIEVEMENT']);
export const reviewTypeEnum = pgEnum('review_type_enum', ['INTERNAL_PLATFORM', 'EXTERNAL_REQUESTED']);
export const moderationStatusEnum = pgEnum('moderation_status_enum', ['PENDING', 'APPROVED', 'REJECTED']);
export const cancellationPartyEnum = pgEnum('cancellation_party_enum', ['BUYER', 'WORKER', 'ADMIN']);

// --- USERS & PROFILES ---

export const usersTable = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(), // App-specific UUID
    firebaseUid: varchar('firebase_uid', { length: 128 }).unique().notNull(), // Firebase UID
    email: varchar('email', { length: 255 }).unique().notNull(),
    // hashedPassword: text('hashed_password'), // Only if not solely relying on Firebase Auth
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    appRole: userRoleEnum('app_role').notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }), // For Buyers
    stripeConnectAccountId: varchar('stripe_connect_account_id', { length: 255 }), // For Workers
    rtwStatus: rtwKycStatusEnum('rtw_status').default('NOT_APPLICABLE'),
    rtwDocumentUrl: text('rtw_document_url'), // Consider encryption/secure storage reference
    kycStatus: rtwKycStatusEnum('kyc_status').default('NOT_APPLICABLE'),
    kycDocumentUrl: text('kyc_document_url'), // Consider encryption/secure storage reference
    isBanned: boolean('is_banned').default(false).notNull(),
    isDisabled: boolean('is_disabled').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gigWorkerProfilesTable = pgTable('gig_worker_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).unique(),
    fullBio: text('full_bio'),
    privateNotes: text('private_notes'),
    responseRateInternal: decimal('response_rate_internal', { precision: 5, scale: 2 }), // e.g., 0.00 to 100.00
    availabilityJson: jsonb('availability_json'), // Detailed rules, excluded dates
    semanticProfileJson: jsonb('semantic_profile_json'), // AI-generated embeddings/rich data
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const buyerProfilesTable = pgTable('buyer_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).unique(),
    fullCompanyName: varchar('full_company_name', { length: 255 }),
    vatNumber: varchar('vat_number', { length: 50 }),
    businessRegistrationNumber: varchar('business_registration_number', { length: 100 }),
    billingAddressJson: jsonb('billing_address_json'), // Store as structured JSON
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembersTable = pgTable('team_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerProfileId: uuid('buyer_profile_id').notNull().references(() => buyerProfilesTable.id, { onDelete: 'cascade' }),
    memberUserId: uuid('member_user_id').references(() => usersTable.id, { onDelete: 'set null' }), // If they are platform users
    name: varchar('name', { length: 255 }).notNull(), // For external team members or display name
    email: varchar('email', { length: 255 }),
    roleInTeam: varchar('role_in_team', { length: 100 }),
    permissionsJson: jsonb('permissions_json'), // Granular permissions within the buyer's team
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});


// --- SKILLS, QUALIFICATIONS, BADGES ---

export const skillsTable = pgTable('skills', {
    id: uuid('id').primaryKey().defaultRandom(),
    workerProfileId: uuid('worker_profile_id').notNull().references(() => gigWorkerProfilesTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    experienceMonths: integer('experience_months').notNull(),
    agreedRate: decimal('agreed_rate', { precision: 10, scale: 2 }).notNull(), // Worker's preferred rate
    skillVideoUrl: text('skill_video_url'),
    adminTags: text('admin_tags').array(), // Array of strings
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const qualificationsTable = pgTable('qualifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    workerProfileId: uuid('worker_profile_id').notNull().references(() => gigWorkerProfilesTable.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    institution: varchar('institution', { length: 255 }),
    yearAchieved: integer('year_achieved'),
    description: text('description'),
    documentUrl: text('document_url'), // Optional link to a certificate
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const equipmentTable = pgTable('equipment', {
    id: uuid('id').primaryKey().defaultRandom(),
    workerProfileId: uuid('worker_profile_id').notNull().references(() => gigWorkerProfilesTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});


export const badgeDefinitionsTable = pgTable('badge_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).unique().notNull(),
    description: text('description').notNull(),
    iconUrlOrLucideName: varchar('icon_url_or_lucide_name', { length: 255 }),
    type: badgeTypeEnum('type').notNull(),
    criteriaJson: jsonb('criteria_json'), // Rules for auto-awarding
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- GIGS ---

export const gigsTable = pgTable('gigs', {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerId: uuid('buyer_id').notNull().references(() => usersTable.id, { onDelete: 'restrict' }), // Buyer who posted
    workerId: uuid('worker_id').references(() => usersTable.id, { onDelete: 'restrict' }), // Worker who accepted
    titleInternal: varchar('title_internal', { length: 255 }).notNull(),
    fullDescription: text('full_description'), // Including private instructions
    exactLocation: text('exact_location'), // Can be more precise, or use PostGIS later
    addressJson: jsonb('address_json'), // Structured address
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    agreedRate: decimal('agreed_rate', { precision: 10, scale: 2 }).notNull(),
    estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
    totalAgreedPrice: decimal('total_agreed_price', { precision: 10, scale: 2 }), // Calculated or set
    statusInternal: gigStatusEnum('status_internal').default('PENDING_WORKER_ACCEPTANCE').notNull(),
    ableFeePercent: decimal('able_fee_percent', { precision: 5, scale: 2 }),
    stripeFeePercent: decimal('stripe_fee_percent', { precision: 5, scale: 2 }),
    stripeFeeFixed: decimal('stripe_fee_fixed', { precision: 5, scale: 2 }),
    promoCodeApplied: varchar('promo_code_applied', { length: 50 }),
    moderationStatus: moderationStatusEnum('moderation_status').default('PENDING').notNull(),
    cancellationReason: text('cancellation_reason'),
    cancellationParty: cancellationPartyEnum('cancellation_party'),
    notesForWorker: text('notes_for_worker'),
    notesForBuyer: text('notes_for_buyer'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gigSkillsRequiredTable = pgTable('gig_skills_required', {
    id: uuid('id').primaryKey().defaultRandom(),
    gigId: uuid('gig_id').notNull().references(() => gigsTable.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name', { length: 100 }).notNull(), // Could also FK to a predefined skills list if preferred
    isRequired: boolean('is_required').default(true),
    notes: text('notes'), // e.g. "Must have 3+ years mixology"
});


// --- PAYMENTS ---

export const paymentsTable = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    gigId: uuid('gig_id').notNull().references(() => gigsTable.id, { onDelete: 'restrict' }),
    payerId: uuid('user_id_payer').notNull().references(() => usersTable.id, { onDelete: 'restrict' }), // Buyer
    receiverId: uuid('user_id_receiver').notNull().references(() => usersTable.id, { onDelete: 'restrict' }), // Worker
    amountGross: decimal('amount_gross', { precision: 10, scale: 2 }).notNull(),
    ableFeeAmount: decimal('able_fee_amount', { precision: 10, scale: 2 }).notNull(),
    stripeFeeAmount: decimal('stripe_fee_amount', { precision: 10, scale: 2 }).notNull(),
    amountNetToWorker: decimal('amount_net_to_worker', { precision: 10, scale: 2 }).notNull(),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique(),
    stripeChargeId: varchar('stripe_charge_id', { length: 255 }).unique(),
    payoutIdToWorker: varchar('payout_id_to_worker', { length: 255 }), // Stripe Payout ID
    invoiceUrl: text('invoice_url'),
    isTesting: boolean('is_testing').default(false).notNull(), // For QA payments
    paymentMethodDetailsJson: jsonb('payment_method_details_json'), // e.g., last4 of card
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    refundReason: text('refund_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});


// --- REVIEWS & CHAT ---

export const reviewsTable = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    gigId: uuid('gig_id').notNull().references(() => gigsTable.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }), // User being reviewed
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    wouldWorkAgain: boolean('would_work_again'),
    awardedBadgeNamesToTargetJson: jsonb('awarded_badge_names_to_target_json'), // Store array of badge names
    isPublic: boolean('is_public').default(true).notNull(), // User controls if their review of OTHERS is public
    type: reviewTypeEnum('type').default('INTERNAL_PLATFORM').notNull(),
    moderationStatus: moderationStatusEnum('moderation_status').default('PENDING').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessagesTable = pgTable('chat_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    gigId: uuid('gig_id').notNull().references(() => gigsTable.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    // receiverId: uuid('receiver_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }), // Not strictly needed if chat is tied to gig with 2 participants
    text: text('text').notNull(),
    imageUrl: text('image_url'),
    isReadByReceiver: boolean('is_read_by_receiver').default(false),
    moderationStatus: moderationStatusEnum('moderation_status').default('PENDING').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});


// --- ADMIN & SYSTEM ---

export const adminLogsTable = pgTable('admin_logs', {
    id: serial('id').primaryKey(), // Using serial for simplicity in logs
    adminUserId: uuid('admin_user_id').notNull().references(() => usersTable.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 255 }).notNull(),
    targetEntityType: varchar('target_entity_type', { length: 100 }),
    targetEntityId: varchar('target_entity_id', { length: 255 }), // UUIDs are strings
    detailsJson: jsonb('details_json'), // e.g., old/new values for an update
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

export const aiPromptsTable = pgTable('ai_prompts', {
    id: uuid('id').primaryKey().defaultRandom(),
    promptKey: varchar('prompt_key', { length: 100 }).unique().notNull(),
    promptText: text('prompt_text').notNull(),
    version: integer('version').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    lastUpdatedByUserId: uuid('last_updated_by_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const passwordRecoveryRequestsTable = pgTable('password_recovery_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).unique().notNull(), // Store hashed token
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mockPaymentsTable = pgTable('mock_payments', { // For QA
    id: uuid('id').primaryKey().defaultRandom(),
    workerId: uuid('worker_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userBadgesLinkTable = pgTable('user_badges_link', {
    userId: uuid('user_id').notNull(),
    badgeId: uuid('badge_id').notNull(),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
    awardedBySystem: boolean('awarded_by_system').default(false), // True if system awarded
    awardedByUserId: uuid('awarded_by_user_id'), // User who awarded (e.g., in a review)
    gigId: uuid('gig_id'), // Optional: badge awarded in context of a gig
}, (table) => [primaryKey({ columns: [table.userId, table.badgeId] })]);

// --- RELATIONS ---
// Drizzle ORM uses these to define relationships for querying

export const usersRelations = relations(usersTable, ({ one, many }) => ({
    gigWorkerProfile: one(gigWorkerProfilesTable, { fields: [usersTable.id], references: [gigWorkerProfilesTable.userId] }),
    buyerProfile: one(buyerProfilesTable, { fields: [usersTable.id], references: [buyerProfilesTable.userId] }),
    gigsAsWorker: many(gigsTable, { relationName: 'WorkerGigs' }),
    gigsAsBuyer: many(gigsTable, { relationName: 'BuyerGigs' }),
    paymentsMade: many(paymentsTable, { relationName: 'PaymentsMadeByPayer' }),
    paymentsReceived: many(paymentsTable, { relationName: 'PaymentsReceivedByReceiver' }),
    reviewsAuthored: many(reviewsTable, { relationName: 'ReviewsAuthoredByAuthor' }),
    reviewsReceived: many(reviewsTable, { relationName: 'ReviewsReceivedForTarget' }),
    adminLogs: many(adminLogsTable),
    passwordRecoveryRequests: many(passwordRecoveryRequestsTable),
    sentChatMessages: many(chatMessagesTable, { relationName: 'SentChatMessages' }),
    aiPromptsUpdated: many(aiPromptsTable),
    userBadges: many(userBadgesLinkTable, { relationName: 'UserBadgesReceived' }), // Added relationName for clarity
    badgesAwardedBy: many(userBadgesLinkTable, { relationName: 'BadgesAwardedByThisUser' }), // If tracking who awarded
}));

export const badgeDefinitionsRelations = relations(badgeDefinitionsTable, ({ many }) => ({
    userBadges: many(userBadgesLinkTable),
  }));

export const gigWorkerProfilesRelations = relations(gigWorkerProfilesTable, ({ one, many }) => ({
    user: one(usersTable, { fields: [gigWorkerProfilesTable.userId], references: [usersTable.id] }),
    skills: many(skillsTable),
    qualifications: many(qualificationsTable),
    equipment: many(equipmentTable),
    gigs: many(gigsTable, { relationName: 'WorkerGigs' }), // Worker is assigned to these gigs
}));

export const buyerProfilesRelations = relations(buyerProfilesTable, ({ one, many }) => ({
    user: one(usersTable, { fields: [buyerProfilesTable.userId], references: [usersTable.id] }),
    teamMembers: many(teamMembersTable),
    gigs: many(gigsTable, { relationName: 'BuyerGigs' }), // Buyer posted these gigs
}));

export const teamMembersRelations = relations(teamMembersTable, ({ one }) => ({
    buyerProfile: one(buyerProfilesTable, { fields: [teamMembersTable.buyerProfileId], references: [buyerProfilesTable.id] }),
    user: one(usersTable, { fields: [teamMembersTable.memberUserId], references: [usersTable.id] }),
}));


export const skillsRelations = relations(skillsTable, ({ one }) => ({
    workerProfile: one(gigWorkerProfilesTable, { fields: [skillsTable.workerProfileId], references: [gigWorkerProfilesTable.id] }),
}));

export const qualificationsRelations = relations(qualificationsTable, ({ one }) => ({
    workerProfile: one(gigWorkerProfilesTable, { fields: [qualificationsTable.workerProfileId], references: [gigWorkerProfilesTable.id] })
}));

export const equipmentRelations = relations(equipmentTable, ({ one }) => ({
    workerProfile: one(gigWorkerProfilesTable, { fields: [equipmentTable.workerProfileId], references: [gigWorkerProfilesTable.id] })
}));

// Define relations FOR userBadgesLinkTable LAST, after all its referenced tables' relations are set up
export const userBadgesLinkRelations = relations(userBadgesLinkTable, ({ one }) => ({
    user: one(usersTable, {
      fields: [userBadgesLinkTable.userId],
      references: [usersTable.id],
      relationName: 'UserBadgesReceived' // Match if used above
    }),
    badge: one(badgeDefinitionsTable, {
      fields: [userBadgesLinkTable.badgeId],
      references: [badgeDefinitionsTable.id]
    }),
    awardedByUser: one(usersTable, { // Relation for the user who awarded the badge
      fields: [userBadgesLinkTable.awardedByUserId],
      references: [usersTable.id],
      relationName: 'BadgesAwardedByThisUser' // Match if used above
    }),
    gig: one(gigsTable, {
      fields: [userBadgesLinkTable.gigId],
      references: [gigsTable.id]
    }),
  }));

export const gigsRelations = relations(gigsTable, ({ one, many }) => ({
    buyer: one(usersTable, { fields: [gigsTable.buyerId], references: [usersTable.id], relationName: 'BuyerGigs' }),
    worker: one(usersTable, { fields: [gigsTable.workerId], references: [usersTable.id], relationName: 'WorkerGigs' }),
    skillsRequired: many(gigSkillsRequiredTable),
    payments: many(paymentsTable),
    reviews: many(reviewsTable),
    chatMessages: many(chatMessagesTable),
    associatedBadges: many(userBadgesLinkTable), // Badges awarded in the context of this gig
}));

export const gigSkillsRequiredRelations = relations(gigSkillsRequiredTable, ({ one }) => ({
    gig: one(gigsTable, { fields: [gigSkillsRequiredTable.gigId], references: [gigsTable.id] })
}));


export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
    gig: one(gigsTable, { fields: [paymentsTable.gigId], references: [gigsTable.id] }),
    payer: one(usersTable, { fields: [paymentsTable.payerId], references: [usersTable.id], relationName: 'PaymentsMadeByPayer' }),
    receiver: one(usersTable, { fields: [paymentsTable.receiverId], references: [usersTable.id], relationName: 'PaymentsReceivedByReceiver' }),
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
    gig: one(gigsTable, { fields: [reviewsTable.gigId], references: [gigsTable.id] }),
    author: one(usersTable, { fields: [reviewsTable.authorId], references: [usersTable.id], relationName: 'ReviewsAuthoredByAuthor' }),
    target: one(usersTable, { fields: [reviewsTable.targetId], references: [usersTable.id], relationName: 'ReviewsReceivedForTarget' }),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
    gig: one(gigsTable, { fields: [chatMessagesTable.gigId], references: [gigsTable.id] }),
    sender: one(usersTable, { fields: [chatMessagesTable.senderId], references: [usersTable.id], relationName: 'SentChatMessages' }),
}));

export const adminLogsRelations = relations(adminLogsTable, ({ one }) => ({
    adminUser: one(usersTable, { fields: [adminLogsTable.adminUserId], references: [usersTable.id] }),
}));

export const aiPromptsRelations = relations(aiPromptsTable, ({ one }) => ({
    lastUpdatedByUser: one(usersTable, { fields: [aiPromptsTable.lastUpdatedByUserId], references: [usersTable.id] })
}));

export const passwordRecoveryRequestsRelations = relations(passwordRecoveryRequestsTable, ({ one }) => ({
    user: one(usersTable, { fields: [passwordRecoveryRequestsTable.userId], references: [usersTable.id] }),
}));

export const mockPaymentsRelations = relations(mockPaymentsTable, ({ one }) => ({
    worker: one(usersTable, { fields: [mockPaymentsTable.workerId], references: [usersTable.id] }),
    buyer: one(usersTable, { fields: [mockPaymentsTable.buyerId], references: [usersTable.id] }),
}));
