"use client";

import React, { useState, useEffect, FormEvent, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext'; // Corrected path
import { auth as firebaseAuthClient } from '@/app/lib/firebase/clientApp'; // Corrected path
import { updatePassword, sendPasswordResetEmail, signOut as firebaseSignOut } from 'firebase/auth';
import { signOut as nextAuthSignOut } from "next-auth/react"; // If using NextAuth

// Assuming shared components are structured like this
import InputField from '@/app/components/form/InputField'; // Corrected path
import SwitchControl from '@/app/components/shared/SwitchControl';
// import Logo from '@/app/components/brand/Logo'; // Corrected path, if needed

import styles from './SettingsPage.module.css';
import { User, Shield, Bell, FileText, LogOut, MessageSquare, Save, CreditCard, EyeOff, Info, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'; // Added new icons

// Define a type for user settings fetched from backend
interface UserSettingsData {
  displayName: string;
  email: string; // Usually not editable directly here
  phone?: string | null; // Added phone field
  // Stripe Connect related fields (essential for Gig Workers, optional for Buyers unless they also act as sellers)
  stripeAccountId: string | null; // The Stripe Connect Account ID
  stripeAccountStatus: 'connected' | 'pending_verification' | 'incomplete' | 'restricted' | 'disabled' | null;
  canReceivePayouts: boolean; // Derived on backend, true if Stripe account is fully setup and can receive payouts

  notificationPreferences: {
    email: {
      gigUpdates: boolean;
      platformAnnouncements: boolean;
      marketing?: boolean;
    };
    sms: {
      gigAlerts: boolean;
    };
  };
  // Add other settings fields as needed (e.g., privacy settings)
  privacySettings: { // Added privacy settings field
    profileVisibility: boolean;
    // Add other privacy settings fields as needed
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string; // userId from the URL

  const {
    isAuthenticated,
    isLoading, // Use isLoading from AppContextValue
    user, // Use user object from AppContextValue
  } = useAppContext();

  const authUserId = user?.uid; // Get user ID from the user object
  const firebaseUser = user; // Alias user as firebaseUser for consistency with original code
  const userPublicProfile = user; // Alias user as userPublicProfile for consistency with original code

  const [userSettings, setUserSettings] = useState<UserSettingsData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Stripe Connect related states
  const [showStripePromptModal, setShowStripePromptModal] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  // Delete Account related states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);


  // Privacy Settings related states
  const [profileVisibility, setProfileVisibility] = useState(false); // State for profile visibility

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState(''); // Added state for phone number
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Notification preferences
  const [emailGigUpdates, setEmailGigUpdates] = useState(false);
  const [emailPlatformAnnouncements, setEmailPlatformAnnouncements] = useState(false);
  const [smsGigAlerts, setSmsGigAlerts] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not authenticated or if trying to access settings for another user
  useEffect(() => {
    if (!isLoading) { // Use isLoading
      if (!isAuthenticated || authUserId !== pageUserId) { // authUserId is now derived from user?.uid
        router.replace('/signin');
      }
    }
  }, [isAuthenticated, isLoading, authUserId, pageUserId, router]); // Update dependency array

  // Fetch user settings from backend API
  useEffect(() => {
    if (isAuthenticated && authUserId === pageUserId) { // authUserId is now derived from user?.uid
      setIsLoadingSettings(true);
      // Replace with your actual API call
      const fetchSettings = async () => {
        try {
          // const response = await fetch(`/api/users/settings`); // API would use authUserId from token
          // if (!response.ok) throw new Error('Failed to fetch settings');
          // const data = await response.json();

          // MOCK DATA FOR NOW - Replace with API call
          await new Promise(res => setTimeout(res, 500)); // Simulate delay
          const data: UserSettingsData = {
            displayName: user?.displayName || 'User', // Access displayName from user object
            email: user?.email || '', // Access email from user object
            phone: '123-456-7890', // Added mock phone data
            // Added mock Stripe data
            stripeAccountId: null, // Or a mock ID like 'acct_123abc'
            stripeAccountStatus: null, // Or 'connected', 'pending_verification', etc.
            canReceivePayouts: false, // Or true

            privacySettings: { // Added mock privacy data
              profileVisibility: true, // Example initial value
            },

            notificationPreferences: {
              email: { gigUpdates: true, platformAnnouncements: true, marketing: false },
              sms: { gigAlerts: false },
            },
          };
          setUserSettings(data);
          setDisplayName(data.displayName);
          setEmailGigUpdates(data.notificationPreferences.email.gigUpdates);
          setEmailPlatformAnnouncements(data.notificationPreferences.email.platformAnnouncements);
          // setSmsGigAlerts(data.notificationPreferences.sms.gigAlerts); // SMS commented out
          setProfileVisibility(data.privacySettings.profileVisibility); // Set initial state for privacy setting
          // setPhone(data.phone || ''); // Set initial state for phone
        } catch (err: any) {
          setError(err.message || 'Could not load settings.');
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [isAuthenticated, authUserId, pageUserId, user]); // Update dependency array

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    setIsSavingProfile(true);
    // TODO: API call to update profile (e.g., PUT /api/users/profile)
    // This API would update both PostgreSQL and relevant Firestore public profile fields
    try {
      console.log("Updating profile with name:", displayName);
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      setSuccessMessage("Profile updated successfully!");
      // Optionally, update useAppContext or trigger a refetch if name changes often
    } catch (err:any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (!user) { // Use user object
        setError("User not authenticated.");
        return;
    }

    setIsSavingProfile(true); // Use same loading state for simplicity or create new
    try {
      // Re-authenticate for sensitive operation (optional but recommended)
      // const credential = EmailAuthProvider.credential(user.email!, currentPassword); // Use user.email
      // await reauthenticateWithCredential(user, credential); // Use user

      // Then update password
      await updatePassword(user, newPassword); // Use user
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err: any) {
      console.error("Password change error:", err);
      setError(err.code === 'auth/wrong-password' ? 'Incorrect current password.' : err.message || "Failed to change password.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    if (!userSettings?.email) {
      setError("Email address not found.");
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuthClient, userSettings.email);
      setSuccessMessage("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    }
  };

  const handleNotificationPreferencesUpdate = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    setIsSavingNotifications(true);
    const preferences = {
      email: { gigUpdates: emailGigUpdates, platformAnnouncements: emailPlatformAnnouncements },
      sms: { gigAlerts: smsGigAlerts },
    };
    // TODO: API call to PUT /api/users/notification-preferences
    try {
      console.log("Updating notification preferences:", preferences);
      await new Promise(res => setTimeout(res, 1000)); // Simulate API
      setSuccessMessage("Notification preferences saved!");
    } catch (err:any) {
      setError(err.message || "Failed to save notification preferences.");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleLogout = async () => {
    clearMessages();
    try {
      await firebaseSignOut(firebaseAuthClient);
      await nextAuthSignOut({ redirect: false }); // If using NextAuth
      router.push('/signin');
    } catch (err: any) {
      setError(err.message || "Logout failed.");
    }
  };

  // Stripe Connect Onboarding
  const handleStripeConnect = async () => {
    clearMessages();
    setIsConnectingStripe(true);
    try {
      // TODO: API call to POST /api/stripe/create-connect-account
      console.log("Initiating Stripe Connect onboarding...");
      // Simulate API call and redirect
      await new Promise(res => setTimeout(res, 1500));
      const mockStripeOnboardingUrl = 'https://connect.stripe.com/setup/acct_123abc'; // Replace with actual URL from API
      window.location.href = mockStripeOnboardingUrl;
    } catch (err: any) {
      setError(err.message || "Failed to initiate Stripe Connect.");
    } finally {
      setIsConnectingStripe(false);
    }
  };

  // Manage Stripe Account / Payment Settings
  const handleManageStripeAccount = async () => {
    clearMessages();
    // setIsConnectingStripe(true); // Use a different loading state if needed
    try {
      // TODO: API call to POST /api/stripe/create-portal-session
      console.log("Opening Stripe Portal...");
      // Simulate API call and redirect
      await new Promise(res => setTimeout(res, 1500));
      const mockStripePortalUrl = 'https://billing.stripe.com/p/session/test_...'; // Replace with actual URL from API
      window.location.href = mockStripePortalUrl;
    } catch (err: any) {
      setError(err.message || "Failed to open Stripe Portal.");
    } finally {
      // setIsConnectingStripe(false); // Reset loading state
    }
  };

  // Delete Account Confirmation
  const handleDeleteAccountConfirmed = async () => {
    clearMessages();
    setIsDeletingAccount(true);
    try {
      // TODO: API call to DELETE /api/users/account
      console.log("Deleting account...");
      // Simulate API call
      await new Promise(res => setTimeout(res, 2000));
      setSuccessMessage("Account deleted successfully. Redirecting...");
      // On success, logout and redirect
      await firebaseSignOut(firebaseAuthClient);
      await nextAuthSignOut({ redirect: false });
      router.push('/signin'); // Or home page
    } catch (err: any) {
      setError(err.message || "Failed to delete account.");
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false); // Close modal regardless of success/failure
    }
  };

  // Handle Profile Visibility Change
  const handleProfileVisibilityChange = async (checked: boolean) => {
    clearMessages();
    // setIsSavingProfile(true); // Use a different loading state if needed
    setProfileVisibility(checked); // Optimistically update UI
    // TODO: API call to PUT /api/users/privacy-settings
    try {
      console.log("Updating profile visibility:", checked);
      await new Promise(res => setTimeout(res, 500)); // Simulate API
      setSuccessMessage("Profile visibility updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile visibility.");
      // Revert state if API fails
      setProfileVisibility(!checked);
    } finally {
      // setIsSavingProfile(false); // Reset loading state
    }
  };

  if (isLoading || isLoadingSettings) { // Use isLoading
    return <div className={styles.loadingContainer}>Loading settings...</div>;
  }

  if (!isAuthenticated || !userSettings) {
    // Should have been caught by useEffect, but as a fallback
    return <div className={styles.loadingContainer}>Unable to load settings. Please ensure you are logged in.</div>;
  }


  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <header className={styles.pageHeader}>
          <h1>Account Settings</h1>
          <p>Manage your account preferences and settings</p> {/* Added descriptive text */}
        </header>

        {error && <p className={styles.errorMessage}>{error}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

        {/* Inline Stripe Prompt / Status Indicator (Alternative to Modal) */}
        {userSettings && userSettings.stripeAccountId && userSettings.stripeAccountStatus === 'connected' && userSettings.canReceivePayouts && (
          <div className={`${styles.section} ${styles.stripeStatusBannerConnected}`}>
            <CheckCircle size={20} /> Stripe account connected and active.
          </div>
        )}
        {userSettings && (!userSettings.stripeAccountId || !userSettings.canReceivePayouts) && ( // Logic for Gig Worker role
          <div className={`${styles.section} ${styles.stripePromptInline}`}> {/* Example: .stripePrompt from user CSS */}
            <div className={styles.stripeIconWrapper}><AlertTriangle size={28} color="#ffc107"/></div>
            <div>
              <h3>Connect Stripe to Get Paid!</h3>
              <p>To receive payments for your gigs, you need to connect a Stripe account. It's secure, free, and quick.</p>
              <p className={styles.stripeStatus}>
                Current Status: {userSettings.stripeAccountStatus ? userSettings.stripeAccountStatus.replace('_', ' ') : 'Not Connected'}
              </p>
              <button onClick={handleStripeConnect} className={styles.stripeButton} disabled={isConnectingStripe}>
                {isConnectingStripe ? 'Connecting...' : 'Connect My Bank Account'}
              </button>
            </div>
          </div>
        )}


        {/* Profile Information Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><User size={20} style={{ marginRight: '0.5rem' }} /> Personal Information</h2>
          {/* ... (DisplayName, Email - as before) ... */}
          <form onSubmit={handleProfileUpdate}>
            <div className={styles.formGroup}>
              <label htmlFor="displayName" className={styles.label}>Display Name</label>
              <InputField
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input // Display only, not editable directly here typically
                id="email"
                type="email"
                value={userSettings.email}
                readOnly
                disabled
                className={styles.inputField} // Or use InputField component with disabled prop
              />
            </div>
             <div className={styles.formGroup}> {/* Added phone field */}
              <label htmlFor="phone" className={styles.label}>Phone Number</label>
              <InputField
                id="phone"
                name="phone"
                type="tel" // Use type="tel" for phone numbers
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder="Your phone number"
              />
            </div>
            <div className={styles.actionButtons}>
              <button type="submit" className={styles.button} disabled={isSavingProfile}>
                <Save size={16} /> {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* Payment Settings Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><CreditCard size={20} style={{ marginRight: '0.5rem' }} /> Payment Settings</h2>
          {userSettings?.stripeAccountId && userSettings.canReceivePayouts ? (
            <div className={styles.settingItem}>
              <span className={styles.settingLabel}>Manage your payouts and bank details.</span>
              <button onClick={handleManageStripeAccount} className={`${styles.button} ${styles.secondary}`}>
                Open Stripe Portal
              </button>
            </div>
          ) : (
            <p className={styles.settingLabel}>Connect your Stripe account to manage payment settings.</p>
          )}
        </section>

        {/* Notification Preferences Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Bell size={20} style={{ marginRight: '0.5rem' }} /> Notification Preferences</h2>
          <form onSubmit={handleNotificationPreferencesUpdate}>
            <SwitchControl
              id="emailGigUpdates"
              label="Email: Gig Updates & Offers"
              checked={emailGigUpdates}
              onCheckedChange={setEmailGigUpdates}
            />
            <SwitchControl
              id="emailPlatformAnnouncements"
              label="Email: Platform News & Announcements"
              checked={emailPlatformAnnouncements}
              onCheckedChange={setEmailPlatformAnnouncements}
            />
            {/* SMS Notification Option (Commented Out) */}
            {/*
            <SwitchControl
              id="smsGigAlerts"
              label="SMS: Urgent Gig Alerts (if phone provided)"
              checked={smsGigAlerts}
              onCheckedChange={setSmsGigAlerts}
            />
            */}
             <div className={styles.actionButtons}>
                <button type="submit" className={styles.button} disabled={isSavingNotifications}>
                    <Save size={16} /> {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
          </form>
        </section>

        {/* Account Security Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Shield size={20} style={{ marginRight: '0.5rem' }} /> Account Security</h2>
          <form onSubmit={handleChangePassword} className={styles.passwordChangeSection}>
             {/* <div className={styles.formGroup}>
              <label htmlFor="currentPassword" className={styles.label}>Current Password</label>
              <InputField
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                required
              />
            </div> */}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>New Password</label>
              <InputField
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
              />
            </div>
             <div className={styles.formGroup}>
              <label htmlFor="confirmNewPassword" className={styles.label}>Confirm New Password</label>
              <InputField
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <div className={styles.actionButtons}>
                <button type="submit" className={styles.button} disabled={isSavingProfile}>
                    {isSavingProfile ? 'Changing...' : 'Change Password'}
                </button>
            </div>
          </form>
          <div style={{marginTop: '1rem', textAlign: 'right'}}>
            <button onClick={handleForgotPassword} className={`${styles.button} ${styles.secondary}`}>
              Forgot Password? Send Reset Link
            </button>
          </div>
        </section>

        {/* Privacy Settings Section (NEW) */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><EyeOff size={20} style={{ marginRight: '0.5rem' }} /> Privacy Settings</h2>
          <SwitchControl
            id="profileVisibility"
            label="Profile Visibility (Public/Private for search)"
            checked={profileVisibility} // Connect to state
            onCheckedChange={handleProfileVisibilityChange} // Connect to handler
          />
          {/* Add more privacy toggles as needed */}
        </section>

        {/* Community & Legal Section (Combined & NEW) */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Info size={20} style={{ marginRight: '0.5rem' }} /> Community & Legal</h2>
          <ul className={styles.linkList}>
            <li><a href="YOUR_DISCORD_LINK" target="_blank" rel="noopener noreferrer">Join our Community Discord</a></li>
            <li><a href="/user-policy" target="_blank" rel="noopener noreferrer">User Policy</a></li>
            <li><a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a></li>
            <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
          </ul>
        </section>

        {/* Actions Section (Bottom Nav from user prompt) */}
        <section className={`${styles.section} ${styles.bottomNavSection}`}>
          <div className={styles.bottomNav}> {/* Using user's class name idea */}
            <button onClick={() => alert('Contact support: support@ableai.com')} className={styles.bottomNavLink}>
              <MessageSquare size={18} /> Contact Able AI Agent
            </button>
            <button onClick={handleLogout} className={styles.bottomNavLink}>
              <LogOut size={18} /> Logout
            </button>
            <button onClick={() => setShowDeleteAccountModal(true)} className={`${styles.bottomNavLink} ${styles.dangerLink}`}>
              <Trash2 size={18} /> Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Stripe Connect Prompt Modal (Optional, if not inline) */}
      {/* {showStripePromptModal && (
        <Modal title="Connect Stripe to Get Paid" onClose={() => setShowStripePromptModal(false)}>
          // Content of the prompt
          <button onClick={handleStripeConnect} disabled={isConnectingStripe}>...</button>
        </Modal>
      )} */}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteAccountModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm Account Deletion</h3>
            <p>Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your data, gigs, and profile information will be removed.</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className={`${styles.button} ${styles.secondary}`}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountConfirmed}
                className={`${styles.button} ${styles.danger}`}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}