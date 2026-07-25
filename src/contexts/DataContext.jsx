/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [teachers, setTeachers] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [gradesLog, setGradesLog] = useState([]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('eduvista_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Fetch Teachers
      const teachersRes = await fetch(`${API_BASE}/teachers`, { headers: getAuthHeaders() });
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData.map(t => ({
          ...t,
          id: t.uid || t.id,
          subjects: t.subjects || [],
          curriculums: t.curricula || t.curriculums || [],
          reviews: t.reviews || []
        })));
      }

      // 2. If user is logged in, fetch their specific data
      if (currentUser) {
        const sessionsRes = await fetch(`${API_BASE}/sessions`, { headers: getAuthHeaders() });
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setBookedSessions(Array.isArray(sessionsData) ? sessionsData : []);
        }

        const walletRes = await fetch(`${API_BASE}/payments/wallet`, { headers: getAuthHeaders() });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWalletBalance(walletData.balance || 0);
          setEscrowBalance(walletData.escrow || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
    }
  }, [currentUser, getAuthHeaders]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <DataContext.Provider value={{
      teachers,
      setTeachers,
      bookedSessions,
      setBookedSessions,
      walletBalance,
      setWalletBalance,
      escrowBalance,
      setEscrowBalance,
      pendingAssignments,
      setPendingAssignments,
      gradesLog,
      setGradesLog,
      fetchInitialData
    }}>
      {children}
    </DataContext.Provider>
  );
};
