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

} from "firebase/firestore";

import { db } from "../clientApp";

// Types
export type FirestoreTimestamp = Timestamp;

export interface UserProfile {
  firebaseUid: string;
  displayName: string;
  profileImageUrl: string;
  currentActiveRole: 'WORKER' | 'BUYER';
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

export interface GigMessage {
  senderFirebaseUid: string;
  text: string;
  timestamp: FirestoreTimestamp;
  isReadByReceiver: boolean;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
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
export async function getUserData(userId: string): Promise<UserProfile> {
  const userDoc = doc(db, "users", userId);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserProfile;
  } else {
    throw new Error("User not found");
  }
}

export async function createUserProfile(userId: string, userData: Omit<UserProfile, 'firebaseUid' | 'createdAt'>) {
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, {
    ...userData,
    firebaseUid: userId,
    createdAt: Timestamp.now(),
  });
}

export async function updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'firebaseUid' | 'createdAt' | 'canBeBuyer' | 'canBeGigWorker' | 'workerAverageRating' | 'workerTotalGigsCompleted' | 'workerResponseRatePercent'>>) {
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, updates);
}

// User Notifications
export async function getUserNotifications(userId: string) {
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notificationRef = doc(db, "users", userId, "notifications", notificationId);
  await updateDoc(notificationRef, { isRead: true });
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notificationRef = doc(db, "users", userId, "notifications", notificationId);
  await deleteDoc(notificationRef);
}

// Gig Functions
export async function createGig(gigData: Omit<Gig, 'createdAt' | 'status'>) {
  const gigsRef = collection(db, "gigs");
  return addDoc(gigsRef, {
    ...gigData,
    status: 'PENDING_WORKER_ACCEPTANCE',
    createdAt: Timestamp.now(),
  });
}

export async function getGig(gigId: string): Promise<Gig | null> {
  const gigDoc = doc(db, "gigs", gigId);
  const gigSnapshot = await getDoc(gigDoc);
  return gigSnapshot.exists() ? gigSnapshot.data() as Gig : null;
}

export async function updateGigStatus(gigId: string, newStatus: GigStatus, workerData?: { workerFirebaseUid: string; workerDisplayName: string; workerProfileImageUrl: string }) {
  const gigDoc = doc(db, "gigs", gigId);
  const updates: Partial<Gig> = { status: newStatus };
  if (workerData) {
    Object.assign(updates, workerData);
  }
  await updateDoc(gigDoc, updates);
}

export async function deleteGig(gigId: string) {
  const gigDoc = doc(db, "gigs", gigId);
  await deleteDoc(gigDoc);
}

// Gig Messages
export async function sendGigMessage(gigId: string, messageData: Omit<GigMessage, 'timestamp' | 'isReadByReceiver' | 'moderationStatus'>) {
  const messagesRef = collection(db, "gigs", gigId, "messages");
  return addDoc(messagesRef, {
    ...messageData,
    timestamp: Timestamp.now(),
    isReadByReceiver: false,
    moderationStatus: 'PENDING'
  });
}

export async function getGigMessages(gigId: string) {
  const messagesRef = collection(db, "gigs", gigId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteGigMessage(gigId: string, messageId: string) {
  const messageRef = doc(db, "gigs", gigId, "messages", messageId);
  await deleteDoc(messageRef);
}

// Gig Offers
export async function createGigOffer(offerData: Omit<GigOffer, 'status' | 'createdAt'>) {
  const offersRef = collection(db, "gigOffers");
  return addDoc(offersRef, {
    ...offerData,
    status: 'SENT',
    createdAt: Timestamp.now(),
  });
}

export async function getGigOffer(offerId: string): Promise<GigOffer | null> {
  const offerDoc = doc(db, "gigOffers", offerId);
  const offerSnapshot = await getDoc(offerDoc);
  return offerSnapshot.exists() ? offerSnapshot.data() as GigOffer : null;
}

export async function updateGigOfferStatus(offerId: string, newStatus: 'ACCEPTED' | 'DECLINED') {
  const offerDoc = doc(db, "gigOffers", offerId);
  await updateDoc(offerDoc, { status: newStatus });
}

export async function deleteGigOffer(offerId: string) {
  const offerDoc = doc(db, "gigOffers", offerId);
  await deleteDoc(offerDoc);
}

// Public Reviews (Read-only)
export async function getPublicReviews() {
  const reviewsRef = collection(db, "public_reviews");
  const snapshot = await getDocs(reviewsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPublicReview(reviewId: string): Promise<PublicReview | null> {
  const reviewDoc = doc(db, "public_reviews", reviewId);
  const reviewSnapshot = await getDoc(reviewDoc);
  return reviewSnapshot.exists() ? { id: reviewId, ...reviewSnapshot.data() } as PublicReview : null;
}

// Badge Definitions (Read-only)
export async function getBadgeDefinitions() {
  const badgesRef = collection(db, "badge_definitions");
  const snapshot = await getDocs(badgesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBadgeDefinition(badgeId: string): Promise<BadgeDefinition | null> {
  const badgeDoc = doc(db, "badge_definitions", badgeId);
  const badgeSnapshot = await getDoc(badgeDoc);
  return badgeSnapshot.exists() ? { id: badgeId, ...badgeSnapshot.data() } as BadgeDefinition : null;
}

// Realtime Subscriptions
export function subscribeToGigUpdates(gigId: string, callback: (gig: Gig | null) => void) {
  const gigDoc = doc(db, "gigs", gigId);
  return onSnapshot(gigDoc, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() as Gig : null);
  });
}

export function subscribeToUserNotifications(userId: string, callback: (notifications: Array<Notification & { id: string }>) => void) {
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Notification })));
  });
}

export function subscribeToGigMessages(gigId: string, callback: (messages: Array<GigMessage & { id: string }>) => void) {
  const messagesRef = collection(db, "gigs", gigId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as GigMessage })));
  });
}

// Query Helpers
export async function getGigsByBuyer(buyerId: string) {
  const gigsRef = collection(db, "gigs");
  const q = query(gigsRef, where("buyerFirebaseUid", "==", buyerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Gig }));
}

export async function getGigsByWorker(workerId: string) {
  const gigsRef = collection(db, "gigs");
  const q = query(gigsRef, where("workerFirebaseUid", "==", workerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Gig }));
}

export async function getPendingGigs() {
  const gigsRef = collection(db, "gigs");
  const q = query(gigsRef, where("status", "==", "PENDING_WORKER_ACCEPTANCE"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Gig }));
}

export async function getGigOffersByBuyer(buyerId: string) {
  const offersRef = collection(db, "gigOffers");
  const q = query(offersRef, where("buyerFirebaseUid", "==", buyerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as GigOffer }));
}

export async function getGigOffersByWorker(workerId: string) {
  const offersRef = collection(db, "gigOffers");
  const q = query(offersRef, where("workerFirebaseUid", "==", workerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as GigOffer }));
}