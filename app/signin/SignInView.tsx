"use client";

import { useState, FormEvent } from "react";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/signin/SignInPage.module.css";
import { signInWithEmailPassword, validateClientPassword } from "@/app/lib/auth/authActions";
import { useRouter } from 'next/navigation';

interface SignInViewProps {
  onToggleRegister: () => void;
  onError: (error: React.ReactNode | null) => void;
}

const SignInView: React.FC<SignInViewProps> = ({ onToggleRegister, onError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null); // Clear previous errors
    setLoading(true);
    const validationResult = await validateClientPassword(password);
    if (!validationResult.success) {
        onError(validationResult.error);
        setLoading(false);
        return;
    }
    const result = await signInWithEmailPassword(email, password);
    setLoading(false);

    if (!result.success) {
      onError(
        result.error ? (
          <>
            {result.error}
            <a href="/reset-password" className={styles.errorLink}>
              Reset password?
            </a>
          </>
        ) : (
          <>
            Email or password is incorrect.{" "}
            <a href="/reset-password" className={styles.errorLink}>
              Reset password?
            </a>
          </>
        )
      );
    } else {
      // Assuming successful sign-in should redirect
      router.push("/select-role"); // Or your desired post-signin page
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