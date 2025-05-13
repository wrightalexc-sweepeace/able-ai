// app/signin/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react"; // NextAuth.js signIn
import {
  signInWithEmailAndPassword, // Firebase client SDK
  createUserWithEmailAndPassword, // Firebase client SDK
  updateProfile, // Firebase client SDK
  type AuthProvider // Firebase type
} from "firebase/auth";
import { auth as firebaseAuthClient } from "@/app/lib/firebase/clientApp"; // Your Firebase client auth
// import Layout from "@/components/layout"; // Your layout component

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'WORKER'>('BUYER');


  const handleFirebaseSignIn = async (idToken: string) => {
    // Now sign in with NextAuth.js using the Firebase ID token
    const result = await signIn("credentials", {
      idToken,
      redirect: false, // Handle redirect manually or based on result
      // callbackUrl: "/", // Or your desired redirect path
    });

    if (result?.error) {
      setError(result.error);
      console.error("NextAuth Sign In Error:", result.error);
    } else if (result?.ok) {
      // Successful NextAuth sign-in, redirect to dashboard or home
      window.location.href = "/"; // Or useRouter().push('/')
    }
    setLoading(false);
  };

  const handleEmailPasswordSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuthClient, email, password);
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
      const userCredential = await createUserWithEmailAndPassword(firebaseAuthClient, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // IMPORTANT: After Firebase registration, you also need to ensure
      // the user and their role are created in your PostgreSQL database.
      // This is typically done via a backend call (Next.js API route or Server Action)
      // that your `findOrCreatePgUserAndUpdateRole` function (called by NextAuth's authorize) handles.
      // For this pattern, NextAuth's authorize callback will handle the PG user creation
      // when it first verifies the ID token. We just need to pass the role information if needed.
      // One way to pass the role is to set a custom claim on the Firebase user *before* getting the ID token,
      // or pass it separately to the NextAuth.js `signIn` call if possible with `credentials`.
      // For simplicity with this `credentials` flow, we might just let `findOrCreatePgUserAndUpdateRole`
      // assign a default role or have a subsequent step for role selection.
      // For AbleAI, role selection is critical during registration.

      // For now, we'll proceed to get the ID token and let NextAuth's authorize handle PG user creation.
      // The `findOrCreatePgUserAndUpdateRole` in your NextAuth `authorize` callback should be
      // robust enough to create the user with a default role if it's their first time.
      // You could also consider a separate API call here to your backend
      // to explicitly set the user's role in PostgreSQL right after Firebase registration.

      const idToken = await userCredential.user.getIdToken(true);
      await handleFirebaseSignIn(idToken);
    } catch (err: any) {
      console.error("Firebase Email/Password Registration Error:", err);
      setError(err.message || "Failed to register.");
      setLoading(false);
    }
  };


  // Example for social/OAuth sign-in (if you add it later)
  // const handleOAuthSignIn = (provider: AuthProvider) => {
  //   setLoading(true);
  //   signInWithPopup(firebaseAuthClient, provider)
  //     .then((credential) => credential.user.getIdToken(true))
  //     .then((idToken) => handleFirebaseSignIn(idToken))
  //     .catch((err) => {
  //       console.error("Firebase OAuth Sign In Error:", err);
  //       setError(err.message || "OAuth sign-in failed.");
  //       setLoading(false);
  //     });
  // };

  return (
    // <Layout>
    <div>
      <h1>{isRegistering ? "Register" : "Sign In"}</h1>
      <form onSubmit={isRegistering ? handleEmailPasswordRegister : handleEmailPasswordSignIn}>
        {isRegistering && (
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div /* className={styles.roleSelection} */> {/* Assuming you have styles */}
            <p>I want to join as:</p>
            <div /* className={styles.roleOptions} */>
              <label /* className={styles.roleOption} */>
                <input
                  type="radio"
                  name="role"
                  value="BUYER"
                  checked={selectedRole === 'BUYER'}
                  onChange={() => setSelectedRole('BUYER')}
                  required
                />
                <span>Buyer</span>
              </label>
              <label /* className={styles.roleOption} */>
                <input
                  type="radio"
                  name="role"
                  value="WORKER"
                  checked={selectedRole === 'WORKER'}
                  onChange={() => setSelectedRole('WORKER')}
                  required
                />
                <span>Gig Worker</span>
              </label>
            </div>
          </div>
        )}


        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : isRegistering ? "Register" : "Sign In"}
        </button>
      </form>
      <button onClick={() => { setIsRegistering(!isRegistering); setError(null); }}>
        {isRegistering ? "Already have an account? Sign In" : "Need an account? Register"}
      </button>

      {/* Example OAuth buttons (add providers to NextAuth config too) */}
      {/*
      <hr />
      <p>Or sign in with:</p>
      <button onClick={() => handleOAuthSignIn(googleProvider)} disabled={loading}>Google</button>
      <button onClick={() => handleOAuthSignIn(githubProvider)} disabled={loading}>GitHub</button>
      */}
    </div>
    // </Layout>
  );
}
