"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  getIdTokenResult,
  IdTokenResult,
  User as FirebaseUser,
} from "firebase/auth";
import { useFirebase } from "./FirebaseContext";

type Claims = {
  role: string;
  haveWorkerProfile?: boolean;
};

export type User = FirebaseUser & {
  token: string;
  claims: Claims;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

const MAX_POLLING_ATTEMPTS = 10;
const POLLING_INTERVAL_MS = 1000;

async function fetchTokenResultWithPolling(
  user: FirebaseUser
): Promise<IdTokenResult | null> {
  for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
    const tokenResult = await getIdTokenResult(user, true);

    if (tokenResult.claims?.role) {
      return tokenResult;
    }

    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { authClient, loading: loadingAuth,  } = useFirebase();

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (!loadingAuth && authClient) {
      unsubscribe = onAuthStateChanged(authClient, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const tokenResult = await fetchTokenResultWithPolling(firebaseUser);
            if (tokenResult) {
              const enrichedUser = Object.assign(firebaseUser, {
                token: tokenResult.token,
                claims: tokenResult.claims as Claims,
              });
              setUser(enrichedUser);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          if (error instanceof Error) {
            debugger;
            console.error("Error fetching token result:", error.message);
          }
        }

        setLoading(false);
      });
    } else {
      setLoading(false);
      setUser(null);
      console.error("Auth client not initialized or still loading.");
    }

    return () => unsubscribe();
  }, [loadingAuth]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
