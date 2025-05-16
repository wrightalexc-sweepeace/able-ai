"use client";

import { getIdToken, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase/clientApp";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
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

  return { user, loading, idToken };
}
