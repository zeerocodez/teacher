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
          // Get the Firebase ID token
          const token = await firebaseUser.getIdToken();
          
          // Verify against our backend and fetch the full user profile
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            setPendingOnboarding(false);
          } else if (response.status === 404) {
            // User authenticated in Firebase, but profile doesn't exist in DB
            setCurrentUser(null);
            setPendingOnboarding(true);
          } else {
            console.error("Failed to authenticate with backend:", response.status);
            setCurrentUser(null);
            setPendingOnboarding(false);
          }
        } catch (error) {
          console.error("Error during backend authentication:", error);
          setCurrentUser(null);
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

  const login = (userData) => {
    setCurrentUser(userData);
    setPendingOnboarding(false);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setPendingOnboarding(false);
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, pendingOnboarding, setPendingOnboarding, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
