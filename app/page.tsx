"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase/clientApp";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isProjectInfoOpen, setIsProjectInfoOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Able AI Logo"
          width={180}
          height={38}
          priority
        />

        <details open={isProjectInfoOpen} onToggle={(e) => setIsProjectInfoOpen((e.target as HTMLDetailsElement).open)}>
          <summary className={styles.summary}>Project Overview</summary>
          <div className={styles.projectInfo}>
            <h2>Able AI Platform</h2>
            <p>A Next.js application that connects gig workers with buyers, featuring:</p>
            <ul>
              <li>Firebase Authentication</li>
              <li>Role-based access control</li>
              <li>Real-time updates with Firestore</li>
              <li>PostgreSQL database for secure data storage</li>
            </ul>
          </div>
        </details>

        <section className={styles.userSection}>
          <h2>User Status</h2>
          {user ? (
            <div className={styles.userInfo}>
              <p>Logged in as: {user.email}</p>
              <div className={styles.userActions}>
                <Link href="/select-role" className={styles.primary}>
                  Select Role
                </Link>
                <button onClick={handleSignOut} className={styles.secondary}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.userActions}>
              <Link href="/signin" className={styles.primary}>
                Sign In
              </Link>
            </div>
          )}
        </section>

        <section className={styles.pagesSection}>
          <h2>Pages Under Development</h2>
          <div className={styles.pagesList}>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/signin</span>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/select-role</span>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/buyer/dashboard</span>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/worker/dashboard</span>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/gigs/[id]</span>
              <span className={styles.badge} data-status="planned">Planned</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
