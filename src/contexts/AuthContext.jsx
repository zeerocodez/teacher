/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  useEffect(() => {
    // Listen for Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the Firebase ID token with 2.5s race timeout
          const token = await Promise.race([
            firebaseUser.getIdToken(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Token timeout")), 2500))
          ]).catch(() => `token_${Date.now()}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          try {
            // Verify against our backend and fetch the full user profile
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const userData = await response.json();
              setCurrentUser(userData);
              setPendingOnboarding(false);
              try {
                localStorage.setItem('eduvistar_user', JSON.stringify(userData));
                if (userData.token || token) {
                  localStorage.setItem('eduvistar_token', userData.token || token);
                }
              } catch (e) {}
            } else if (response.status === 404) {
              // Check if we have a locally stored active session first
              const cached = localStorage.getItem('eduvistar_user');
              if (cached) {
                try {
                  const parsed = JSON.parse(cached);
                  if (parsed.uid === firebaseUser.uid || parsed.email === firebaseUser.email) {
                    setCurrentUser(parsed);
                    setPendingOnboarding(false);
                    setLoading(false);
                    return;
                  }
                } catch (e) {}
              }
              // User authenticated in Firebase, but profile doesn't exist in DB
              setCurrentUser(null);
              setPendingOnboarding(true);
            } else {
              console.error("Failed to authenticate with backend:", response.status);
              const cached = localStorage.getItem('eduvistar_user');
              if (cached) {
                try {
                  setCurrentUser(JSON.parse(cached));
                } catch (e) {
                  setCurrentUser(null);
                }
              }
              setPendingOnboarding(false);
            }
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            console.warn("Backend auth/me timeout or offline, using cached/fallback user session if available:", fetchErr);
            const cached = localStorage.getItem('eduvistar_user');
            if (cached) {
              try {
                setCurrentUser(JSON.parse(cached));
              } catch (e) {}
            }
            setPendingOnboarding(false);
          }
        } catch (error) {
          console.error("Error during backend authentication:", error);
          const cached = localStorage.getItem('eduvistar_user');
          if (cached) {
            try {
              setCurrentUser(JSON.parse(cached));
            } catch (e) {}
          }
          setPendingOnboarding(false);
        }
      } else {
        // User is signed out of Firebase
        setCurrentUser(null);
        setPendingOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData, token) => {
    setCurrentUser(userData);
    setPendingOnboarding(false);
    try {
      localStorage.setItem('eduvistar_user', JSON.stringify(userData));
      if (token || userData?.token) {
        localStorage.setItem('eduvistar_token', token || userData.token);
      }
    } catch (e) {}
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setCurrentUser(null);
    setPendingOnboarding(false);
    try {
      localStorage.removeItem('eduvistar_user');
      localStorage.removeItem('eduvistar_token');
      localStorage.removeItem('eduvistar_ref');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, pendingOnboarding, setPendingOnboarding, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
