"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth as firebaseAuthClient } from "@/app/lib/firebase/clientApp";

// Assuming shared auth components are in app/components/auth/
import Logo from "@/app/components/brand/Logo";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton"; // Updated SubmitButton

import styles from "./SignInPage.module.css"; // Styles for this page

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFirebaseSignIn = async (idToken: string) => {
    const result = await signIn("credentials", {
      idToken,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      console.error("NextAuth Sign In Error:", result.error);
    } else if (result?.ok) {
      window.location.href = "/"; // Or useRouter().push('/')
    }
    setLoading(false);
  };

  const handleEmailPasswordSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuthClient,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken(true);
      await handleFirebaseSignIn(idToken);
    } catch (err: any) {
      console.error("Firebase Email/Password Sign In Error:", err);
      setError(err.message || "Failed to sign in.");
      setLoading(false);
    }
  };

  const handleEmailPasswordRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuthClient,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: name });

      // The role will be passed to NextAuth's authorize callback via handleFirebaseSignIn
      const idToken = await userCredential.user.getIdToken(true);
      await handleFirebaseSignIn(idToken);
    } catch (err: any) {
      console.error("Firebase Email/Password Registration Error:", err);
      setError(err.message || "Failed to register.");
      setLoading(false);
    }
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
              "Welcome Back!"
            )}
          </h1>
        </div>

        <form
          className={styles.form}
          onSubmit={
            isRegistering
              ? handleEmailPasswordRegister
              : handleEmailPasswordSignIn
          }
        >
          {isRegistering && (
            <div className={styles.inputGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone Number
              </label>
              <InputField
                type="text"
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <InputField
              type="email"
              id="email"
              name="email"
              placeholder="enter email"
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
              id="password"
              name="password"
              placeholder={
                isRegistering ? "make it secure..." : "Enter your password"
              }
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          {/* The SubmitButton itself is placed inside the submitWrapper */}
          {/* The positioning of the button is handled by SignInPage.module.css (.submitWrapper) */}
          <div className={styles.submitWrapper}>
            {" "}
            {/* Make sure this class exists and positions correctly */}
            <SubmitButton loading={loading} disabled={loading}>
              {isRegistering ? "Register" : "Sign In"}
            </SubmitButton>
          </div>
        </form>

        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError(null);
            // Optionally reset form fields
            // setEmail("");
            // setPassword("");
            // setName("");
          }}
        >
          {isRegistering
            ? "Already have an account? Sign In"
            : "Need an account? Create one"}
        </button>
      </div>
    </div>
  );
}
