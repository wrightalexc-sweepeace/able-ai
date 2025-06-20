"use client";

import { authClient } from "@/lib/firebase/clientApp";
import { getIdToken, onAuthStateChanged, User, signOut } from "firebase/auth";
import { useEffect, useState } from "react";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authClient, (authUser) => {
      setUser(authUser);
      setLoading(false);
      if (!authUser) {
        setIdToken(null);
        return;
      }
      getIdToken(authUser)
        .then((token) => {
          setIdToken(token);
        });

    });

    return () => unsubscribe();
  }, []);

  return { user, loading, idToken, signOut };
}
