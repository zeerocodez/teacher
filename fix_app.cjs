const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
let lines = c.split('\n');

const correctBlock = `  const loadFilteredTeachers = async (filters = {}, page = 1, append = false) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 12,
        ...filters
      });
      
      const teachersRes = await fetch(\`\${API_BASE}/teachers?\${queryParams}\`, {
        headers: getAuthHeaders()
      });
      
      if (!teachersRes.ok) {
        throw new Error('Failed to fetch teachers from API');
      }
      
      const teachersData = await teachersRes.json();
      
      let newTeachers = [];
      if (Array.isArray(teachersData.data)) {
        newTeachers = teachersData.data;
      } else if (Array.isArray(teachersData)) {
        newTeachers = teachersData;
      }
      
      if (append && page > 1) {
        setTeachers(prev => {
          const combined = [...prev, ...newTeachers];
          return Array.from(new Map(combined.map(t => [t.uid || t.id, t])).values());
        });
      } else {
        setTeachers(newTeachers);
      }
      
      setHasMoreTeachers(!!teachersData.hasMore);
      setTeachersPage(page);
    } catch (err) {
      console.warn("Using local teachers fallback:", err.message);
    }
  };

  const fetchInitialData = async () => {
    try {
      await loadFilteredTeachers({}, 1, false);

      const activeUid = currentUser ? currentUser.uid : 'parent_1';
      const dashboardRes = await fetch(\`\${API_BASE}/parents/dashboard/\${activeUid}\`, {
        headers: getAuthHeaders()
      });

      if (dashboardRes.ok) {
        const d = await dashboardRes.json();
        if (d.sessions) {
          setBookedSessions(d.sessions.map(s => {
            const matchedTeacher = teachers.find(t => t.id === s.teacherId || t.uid === s.teacherId);
            return {
              ...s,
              id: s.id,
              teacherId: s.teacherId,
              teacherName: s.teacherName,
              avatar: s.avatar || matchedTeacher?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
              subject: s.subject,
              slot: s.slot,
              cost: s.cost,
              status: s.status
            };
          }));
        }
        if (d.grades) {
          setGradesLog(d.grades);
        }
      }
    } catch (error) {
      console.warn("Dashboard fetch error:", error.message);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!currentUser) return;
      const res = await fetch(\`\${API_BASE}/notifications/\${currentUser.uid}\`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter(n => !n.read);
        if (unread.length > prevUnreadCountRef.current && unread.length > 0) {
          const newest = unread[0];
          setActiveToast(newest);
          setTimeout(() => setActiveToast(null), 4000);
        }
        prevUnreadCountRef.current = unread.length;
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch(\`\${API_BASE}/notifications/\${id}/read\`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(\`\${API_BASE}/notifications/read-all/\${currentUser.uid}\`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      prevUnreadCountRef.current = 0;
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {`;

lines.splice(321, 8, correctBlock);
fs.writeFileSync('src/App.jsx', lines.join('\n'), 'utf8');
console.log('App.jsx fixed successfully!');
