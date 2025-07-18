import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  where,
  addDoc,
  deleteDoc,
  setDoc,
  Firestore,
} from "firebase/firestore";

// Types
export type FirestoreTimestamp = Timestamp;

// Unified Chat Message Interface
export interface ChatMessage {
  id?: string; // Firestore document ID
  senderId: string; // Firebase UID of sender or 'AI'
  role: 'user' | 'worker' | 'buyer' | 'admin' | 'ai';
  text: string;
  timestamp: FirestoreTimestamp;
  isReadByReceiver: boolean; // Status for the receiver of this specific message
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_FLAGGED' | 'ESCALATED' | 'RESOLVED';
  isStreaming?: boolean; // True if the message was streamed (relevant for AI)
  isChat: boolean; // True for conversational messages
  contextType: 'onboarding' | 'support' | 'expand_view' | 'edit' | 'gig' | 'admin_support';
  gigId?: string; // ID of the relevant gig (if contextType is 'gig')
  sessionId?: string; // Optional ID for grouping related non-gig chats
  metadata?: Record<string, unknown>; // Optional JSON object for additional context
  // Note: senderFirebaseUid from old GigMessage is now senderId
}

// Parent Chat Document Interfaces (if needed)
// These are less critical if using subcollections directly, but can store chat-level metadata
export interface UserAIChat {
  id?: string; // Firestore document ID (chatId)
  userId: string; // The owner of this AI chat session
  contextType: 'onboarding' | 'support' | 'expand_view' | 'edit';
  createdAt: FirestoreTimestamp;
  metadata?: Record<string, unknown>; // Optional JSON object for additional context
  status?: string; // e.g., 'OPEN', 'CLOSED'
}

export interface AdminChat {
  id?: string; // Firestore document ID (chatId)
  userId: string; // The user being supported in this chat
  createdAt: FirestoreTimestamp;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; // Status of the admin support case
  adminUserId?: string; // The admin currently assigned
  metadata?: Record<string, unknown>; // Optional JSON object for additional context
}

export interface UserProfile {
  firebaseUid: string;
  displayName: string;
  profileImageUrl: string;
  currentActiveRole: 'GIG_WORKER' | 'BUYER';
  canBeBuyer: boolean;
  canBeGigWorker: boolean;
  createdAt: FirestoreTimestamp;
  fcmToken?: string;
  workerAverageRating?: number;
  workerTotalGigsCompleted?: number;
  workerResponseRatePercent?: number;
  workerPublicBio?: string;
  workerAvailabilitySummary?: string;
  workerQrCodeUrl?: string;
  buyerPublicCompanyName?: string;
  isOnline?: boolean;
  lastSeen?: FirestoreTimestamp;
  workerPublicSkillsSummary?: string;
}

export interface Notification {
  isRead: boolean;
}

export type GigStatus = 
  | 'PENDING_WORKER_ACCEPTANCE'
  | 'ACCEPTED'
  | 'DECLINED_BY_WORKER'
  | 'IN_PROGRESS'
  | 'PENDING_COMPLETION'
  | 'CANCELLED_BY_BUYER'
  | 'COMPLETED';

export interface Gig {
  title: string;
  publicDescription: string;
  roleNeeded: string;
  status: GigStatus;
  publicLocation: string;
  startTime: FirestoreTimestamp;
  endTime: FirestoreTimestamp;
  publicRateDisplay: string;
  buyerFirebaseUid: string;
  buyerDisplayName: string;
  buyerProfileImageUrl: string;
  requiredSkillsKeywords: string[];
  createdAt: FirestoreTimestamp;
  workerFirebaseUid?: string;
  workerDisplayName?: string;
  workerProfileImageUrl?: string;
}

export type GigOfferStatus = 'SENT' | 'ACCEPTED' | 'DECLINED';

export interface GigOffer {
  gigTitleOrRef: string;
  buyerFirebaseUid: string;
  workerFirebaseUid: string;
  offeredRate: string;
  status: GigOfferStatus;
  createdAt: FirestoreTimestamp;
  expiresAt: FirestoreTimestamp;
}

export interface PublicReview {
  // Read-only collection
  id: string;
  // Add other fields as needed
}

export interface BadgeDefinition {
  // Read-only collection
  id: string;
  // Add other fields as needed
}

// User Functions
export async function getUserData(db: Firestore,userId: string): Promise<UserProfile> {
  const userDoc = doc(db, "users", userId);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    const userData = userSnapshot.data() as UserProfile;
    return userData;
  } else {
    throw new Error("User not found");
  }
}

export async function getFirestoreUserByFirebaseUid(db: Firestore, firebaseUid: string) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("firebaseUid", "==", firebaseUid));
  const userSnapshot = await getDocs(q);
  if (!userSnapshot.empty) {
    const userData = userSnapshot.docs[0].data() as UserProfile;
    return userData;
  } else {
    throw new Error("User not found");
  }
}

export async function createUserProfile(
  db: Firestore,
  userId: string,
  userData: Omit<UserProfile, 'firebaseUid' | 'createdAt' | 'currentActiveRole' | 'lastSeen'> // Exclude fields managed by rules/later steps/backend
) {
  const userDoc = doc(db, "users", userId);
  // Set minimal required data for initial creation based on rules
  // NOTE: This might still fail if claims for canBeBuyer/canBeGigWorker are not set BEFORE this call.
  // A cloud function triggered by auth.user().onCreate might be a more robust place to set claims and create the Firestore doc.
  await setDoc(userDoc, {
    firebaseUid: userId,
    displayName: userData.displayName,
    profileImageUrl: userData.profileImageUrl,
    // Set initial values required by rules, potentially placeholders
    currentActiveRole: 'BUYER', // Placeholder, will be updated during onboarding
    canBeBuyer: userData.canBeBuyer || false, // Use provided value or default
    canBeGigWorker: userData.canBeGigWorker || false, // Use provided value or default
    createdAt: Timestamp.now(),
    //lastSeen: Timestamp.now(), // Consider setting this in backend on auth state change
  }, { merge: true }); // Use merge: true to allow adding other fields later
}

export async function updateUserProfile(
  db: Firestore,
  userId: string,
  updates: Partial<
    Omit<
      UserProfile,
      | 'canBeBuyer'
      | 'canBeGigWorker'
      | 'workerAverageRating'
      | 'workerTotalGigsCompleted'
      | 'workerResponseRatePercent'
      | 'firebaseUid' // Cannot update firebaseUid
      | 'createdAt' // Cannot update createdAt
    >
  >
) {
  const userRef = collection(db, "users");
  const q = query(userRef, where("firebaseUid", "==", userId));
  const userSnapshot = await getDocs(q);
  if (!userSnapshot.empty) {
    const userDoc = userSnapshot.docs[0].ref;
    await updateDoc(userDoc, updates);
  } else {
    throw new Error("User not found");
  }
}

// User Notifications
export async function getUserNotifications(db: Firestore, userId: string) {
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function markNotificationAsRead(db: Firestore, userId: string, notificationId: string) {
  const notificationRef = doc(db, "users", userId, "notifications", notificationId);
  await updateDoc(notificationRef, { isRead: true });
}

export async function deleteNotification(db: Firestore, userId: string, notificationId: string) {
  const notificationRef = doc(db, "users", userId, "notifications", notificationId);
  await deleteDoc(notificationRef);
}

// User AI Chat Functions (/users/{userId}/aiChats/{chatId}/messages)

// Function to send a message in a user's AI chat
export async function sendUserAIChatMessage(db: Firestore, userId: string, chatId: string, messageData: Omit<ChatMessage, 'timestamp' | 'isReadByReceiver' | 'moderationStatus' | 'id' | 'gigId' | 'sessionId'>) {
  const messagesRef = collection(db, "users", userId, "aiChats", chatId, "messages");
  return addDoc(messagesRef, {
    ...messageData,
    timestamp: Timestamp.now(),
    isReadByReceiver: false, // Default as not read by the other party yet
    moderationStatus: 'PENDING', // Default status
    // Ensure senderId and role are set correctly in messageData
  });
}

// Function to get messages for a user's AI chat
export async function getUserAIChatMessages(db: Firestore, userId: string, chatId: string): Promise<(ChatMessage & { id: string })[]> {
  const messagesRef = collection(db, "users", userId, "aiChats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ChatMessage }));
}

// Function to subscribe to messages for a user's AI chat
export function subscribeToUserAIChatMessages(db: Firestore, userId: string, chatId: string, callback: (messages: (ChatMessage & { id: string })[]) => void) {
  const messagesRef = collection(db, "users", userId, "aiChats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ChatMessage }));
    callback(messages);
  });
}

// Optional: Function to create the parent AI chat document if needed (rules might allow creation directly)
export async function createUserAIChatSession(db: Firestore, userId: string, chatId: string, sessionData: Omit<UserAIChat, 'id' | 'createdAt' | 'userId'>) {
  const sessionRef = doc(db, "users", userId, "aiChats", chatId);
  await setDoc(sessionRef, {
    userId: userId, // Explicitly set userId to match path
    createdAt: Timestamp.now(),
    ...sessionData
  });
}

// Gig Functions
export async function createGig(db: Firestore, gigData: Omit<Gig, 'createdAt' | 'status'>) {
  const gigsRef = collection(db, "gigs");
  return addDoc(gigsRef, {
    ...gigData,
    status: 'PENDING_WORKER_ACCEPTANCE',
    createdAt: Timestamp.now(),
  });
}

export async function getGig(db: Firestore, gigId: string): Promise<Gig | null> {
  const gigDoc = doc(db, "gigs", gigId);
  const gigSnapshot = await getDoc(gigDoc);
  return gigSnapshot.exists() ? gigSnapshot.data() as Gig : null;
}

export async function updateGigStatus(db: Firestore, gigId: string, newStatus: GigStatus, workerData?: { workerFirebaseUid: string; workerDisplayName: string; workerProfileImageUrl: string }) {
  const gigDoc = doc(db, "gigs", gigId);
  const updates: Partial<Gig> = { status: newStatus };
  if (workerData) {
    Object.assign(updates, workerData);
  }
  await updateDoc(gigDoc, updates);
}

export async function deleteGig(db: Firestore, gigId: string) {
  const gigDoc = doc(db, "gigs", gigId);
  await deleteDoc(gigDoc);
}

// Gig Messages (Updated to use /gigs/{gigId}/chats/{chatId}/messages path)
// Assuming a default chatId like 'default' for now, or it should be passed as a parameter
const DEFAULT_GIG_CHAT_ID = 'default'; // Define a constant for the default chat ID within a gig

export async function sendGigMessage(db: Firestore, gigId: string, chatId: string = DEFAULT_GIG_CHAT_ID, messageData: Omit<ChatMessage, 'timestamp' | 'isReadByReceiver' | 'moderationStatus' | 'id' | 'gigId' | 'sessionId' | 'contextType' | 'isChat'>) {
  const messagesRef = collection(db, "gigs", gigId, "chats", chatId, "messages");
  return addDoc(messagesRef, {
    ...messageData,
    timestamp: Timestamp.now(),
    isReadByReceiver: false,
    moderationStatus: 'PENDING',
    contextType: 'gig', // Set context type
    isChat: true, // Mark as a chat message
    gigId: gigId, // Store gigId in message for easier querying
    // Ensure senderId and role are set correctly in messageData
  });
}

export async function getGigMessages(db: Firestore, gigId: string, chatId: string = DEFAULT_GIG_CHAT_ID): Promise<(ChatMessage & { id: string })[]> {
  const messagesRef = collection(db, "gigs", gigId, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ChatMessage }));
}

export async function deleteGigMessage(db: Firestore, gigId: string, chatId: string = DEFAULT_GIG_CHAT_ID, messageId: string) {
  const messageRef = doc(db, "gigs", gigId, "chats", chatId, "messages", messageId);
  await deleteDoc(messageRef);
}

export function subscribeToGigMessages(db: Firestore, gigId: string, chatId: string = DEFAULT_GIG_CHAT_ID, callback: (messages: (ChatMessage & { id: string })[]) => void) {
  const messagesRef = collection(db, "gigs", gigId, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ChatMessage }));
    callback(messages);
  });
}

// Admin Support Chat Functions (/adminChats/{chatId}/messages)

// Function to send a message in an admin support chat
export async function sendAdminChatMessage(db: Firestore, chatId: string, messageData: Omit<ChatMessage, 'timestamp' | 'isReadByReceiver' | 'moderationStatus' | 'id' | 'gigId' | 'sessionId'>) {
  const messagesRef = collection(db, "adminChats", chatId, "messages");
  return addDoc(messagesRef, {
    ...messageData,
    timestamp: Timestamp.now(),
    isReadByReceiver: false, // Default
    moderationStatus: 'PENDING', // Default
    contextType: 'admin_support', // Set context type
    isChat: true, // Mark as chat message
    // Ensure senderId and role are set correctly in messageData
  });
}

// Function to get messages for an admin support chat
export async function getAdminChatMessages(db: Firestore, chatId: string): Promise<(ChatMessage & { id: string })[]> {
  const messagesRef = collection(db, "adminChats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ChatMessage }));
}

// Function to subscribe to messages for an admin support chat
export function subscribeToAdminChatMessages(db: Firestore, chatId: string, callback: (messages: (ChatMessage & { id: string })[]) => void) {
  const messagesRef = collection(db, "adminChats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ChatMessage }));
    callback(messages);
  });
}

// Optional: Function to create the parent Admin Chat document
export async function createAdminChatSession(db: Firestore, chatId: string, sessionData: Omit<AdminChat, 'id' | 'createdAt'>) {
  const sessionRef = doc(db, "adminChats", chatId);
  await setDoc(sessionRef, {
    createdAt: Timestamp.now(),
    ...sessionData
  });
}

// Gig Offers
export async function createGigOffer(db: Firestore, offerData: Omit<GigOffer, 'status' | 'createdAt'>) {
  const offersRef = collection(db, "gigOffers");
  return addDoc(offersRef, {
    ...offerData,
    status: 'SENT',
    createdAt: Timestamp.now(),
  });
}

export async function getGigOffer(db: Firestore, offerId: string): Promise<GigOffer | null> {
  const offerDoc = doc(db, "gigOffers", offerId);
  const offerSnapshot = await getDoc(offerDoc);
  return offerSnapshot.exists() ? offerSnapshot.data() as GigOffer : null;
}

export async function updateGigOfferStatus(db: Firestore, offerId: string, newStatus: 'ACCEPTED' | 'DECLINED') {
  const offerDoc = doc(db, "gigOffers", offerId);
  await updateDoc(offerDoc, { status: newStatus });
}

export async function deleteGigOffer(db: Firestore, offerId: string) {
  const offerDoc = doc(db, "gigOffers", offerId);
  await deleteDoc(offerDoc);
}

// Public Reviews (Read-only from client)
export async function getPublicReviews(db: Firestore) {
  const reviewsRef = collection(db, "public_reviews");
  const snapshot = await getDocs(reviewsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPublicReview(db: Firestore, reviewId: string): Promise<PublicReview | null> {
  const reviewDoc = doc(db, "public_reviews", reviewId);
  const reviewSnapshot = await getDoc(reviewDoc);
  return reviewSnapshot.exists() ? reviewSnapshot.data() as PublicReview : null;
}

// Badge Definitions (Read-only from client)
export async function getBadgeDefinitions(db: Firestore) {
  const badgesRef = collection(db, "badge_definitions");
  const snapshot = await getDocs(badgesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBadgeDefinition(db: Firestore, badgeId: string): Promise<BadgeDefinition | null> {
  const badgeDoc = doc(db, "badge_definitions", badgeId);
  const badgeSnapshot = await getDoc(badgeDoc);
  return badgeSnapshot.exists() ? badgeSnapshot.data() as BadgeDefinition : null;
}

// Subscriptions (Modified Gig Messages Subscription)
export function subscribeToGigUpdates(db: Firestore, gigId: string, callback: (gig: Gig | null) => void) {
  const gigDoc = doc(db, "gigs", gigId);
  return onSnapshot(gigDoc, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() as Gig : null);
  });
}

export function subscribeToUserNotifications(db: Firestore, userId: string, callback: (notifications: Array<Notification & { id: string }>) => void) {
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Notification }));
    callback(notifications);
  });
}

// Other Gig Queries
export async function getGigsByBuyer(db: Firestore, buyerId: string) {
  const gigsRef = collection(db, "gigs");
  const q = query(gigsRef, where("buyerFirebaseUid", "==", buyerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Gig }));
}

export async function getGigsByWorker(db: Firestore, workerId: string) {
  const gigsRef = collection(db, "gigs");
  const q = query(gigsRef, where("workerFirebaseUid", "==", workerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Gig }));
}

export async function getPendingGigs(db: Firestore) {
  const gigsRef = collection(db, "gigs");
  const q = query(gigsRef, where("status", "==", "PENDING_WORKER_ACCEPTANCE"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Gig }));
}

// Gig Offer Queries
export async function getGigOffersByBuyer(db: Firestore, buyerId: string) {
  const offersRef = collection(db, "gigOffers");
  const q = query(offersRef, where("buyerFirebaseUid", "==", buyerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as GigOffer }));
}

export async function getGigOffersByWorker(db: Firestore, workerId: string) {
  const offersRef = collection(db, "gigOffers");
  const q = query(offersRef, where("workerFirebaseUid", "==", workerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as GigOffer }));
}