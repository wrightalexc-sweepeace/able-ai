"use client";

import { useState } from "react";
import { Toaster } from 'sonner';
import Logo from "@/app/components/brand/Logo";
import styles from "./SignInPage.module.css";
import SignInView from "@/app/signin/SignInView";
import RegisterView from "@/app/signin/RegisterView";

export default function SignInPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const handleToggleRegister = () => {
    setIsRegistering(!isRegistering);
    setError(null); // Clear error when switching views
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>
        <div className={styles.header}>
          <h1>
            {isRegistering ? (
              <>
                <span>Welcome!</span>
                <br />
                <span>Please register to get started</span>
              </>
            ) : (
              "Welcome back!"
            )}
          </h1>
        </div>

        {/* Render either SignInView or RegisterView */}
        {isRegistering ? (
          <RegisterView
            onToggleRegister={handleToggleRegister}
            onError={setError}
          />
        ) : (
          <SignInView
            onToggleRegister={handleToggleRegister}
            onError={setError}
          />
        )}

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorCloseBtn} /*onClick={handleCloseError}*/>
              X
            </span>
          </div>
        )}

      </div>
      <Toaster />
    </div>
  );
}
