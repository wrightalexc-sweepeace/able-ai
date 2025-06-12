"use client";

import { useState } from "react";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/signin/SignInPage.module.css";
import { useRouter } from 'next/navigation';
import { authClient } from "@/lib/firebase/firebase-client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signInWithFirebase } from "@/actions/auth/singin";

interface SignInViewProps {
  onToggleRegister: () => void;
  onError: (error: React.ReactNode | null) => void;
}

const SignInView: React.FC<SignInViewProps> = ({ onToggleRegister, onError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
  
    try {
      const userCredential = await signInWithEmailAndPassword(
        authClient,
        email,
        password
      );
  
      const user = userCredential.user;
  
      if (!user?.uid) {
        throw new Error("User UID not found");
      }
  
      const response = await signInWithFirebase(user.uid);
  
      if (response?.error) {
        throw new Error(response.error);
      }
  
      // Force refresh of ID token and claims
      await user.getIdToken(true);
      await user.getIdTokenResult();
  
      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>
          Email Address
        </label>
        <InputField
          type="email"
          id="email-signin"
          name="email-signin"
          placeholder="Enter your email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <InputField
          type="password"
          id="password-signin"
          name="password-signin"
          placeholder="Enter your password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          required
        />
        <a href="/reset-password" className={styles.forgotPassword}>
          Forgot Password?
        </a>
      </div>

      <div className={styles.submitWrapper}>
        <SubmitButton loading={loading} disabled={loading}>
          Sign In
        </SubmitButton>
      </div>

      <button
        type="button"
        className={styles.toggleButton}
        onClick={onToggleRegister}
      >
        Need an account? <span className={styles.linkText}>Create one</span>
      </button>
    </form>
  );
};

export default SignInView; 