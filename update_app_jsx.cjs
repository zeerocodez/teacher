const fs = require('fs');
const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add new states below `setTeachers`
const stateRegex = /const \[teachers, setTeachers\] = useState\(\[[\s\S]*?\]\);/;
if (content.match(stateRegex)) {
  const replacement = `$&
  const [hasMoreTeachers, setHasMoreTeachers] = useState(false);
  const [teachersPage, setTeachersPage] = useState(1);`;
  content = content.replace(stateRegex, replacement);
  console.log('Added pagination states.');
}

// 2. Add loadFilteredTeachers function before fetchInitialData
const fetchInitialRegex = /const fetchInitialData = async \(\) => \{/;
const loadTeachersFunc = `const loadFilteredTeachers = async (filters = {}, page = 1, append = false) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 12,
        ...filters
      });
      
      const teachersRes = await fetch(\`\${API_BASE}/teachers?\${queryParams}\`, {
        headers: getAuthHeaders()
      });
      
      if (teachersRes.ok) {
        const result = await teachersRes.json();
        // Fallback for old API just in case
        const teachersData = Array.isArray(result) ? result : result.data || [];
        const pagination = result.pagination || { totalPages: 1 };
        
        const formattedTeachers = teachersData.map(t => ({
          ...t,
          id: t.uid || t.id,
          subjects: t.subjects || [],
          curriculums: t.curricula || t.curriculums || [],
          reviews: t.reviews || []
        }));
        
        const demoUids = ['teacher_1', 'teacher_2', 'teacher_3', 'teacher_4', 'teacher_5', 'teacher_6', 'teacher_test_pay'];
        const realTeachers = formattedTeachers.filter(t => !demoUids.includes(t.uid));
        
        if (realTeachers.length > 0) {
          setTeachers(prev => append ? [...prev, ...realTeachers] : realTeachers);
        } else if (!append && formattedTeachers.length === 0) {
           // If backend has no real teachers and we are not appending, don't overwrite demo teachers
        } else if (!append) {
           // If backend returns demo teachers because they are in the DB? 
           // Wait, backend shouldn't return demo teachers if they aren't in DB.
           // If we reach here, it means we fetched but found no real teachers. We keep initial state.
        }
        
        setHasMoreTeachers(page < pagination.totalPages);
        setTeachersPage(page);
      }
    } catch (err) {
      console.error("Failed to load teachers:", err);
    }
  };

  const fetchInitialData = async () => {`;

if (content.match(fetchInitialRegex)) {
  content = content.replace(fetchInitialRegex, loadTeachersFunc);
  console.log('Added loadFilteredTeachers.');
}

// 3. Replace teachersRes logic inside fetchInitialData
const teachersResLogic = /const teachersRes = await fetch\([\s\S]*?if \(realTeachers\.length > 0\) \{\s*setTeachers\(realTeachers\);\s*\}\s*\}/;
if (content.match(teachersResLogic)) {
  content = content.replace(teachersResLogic, `await loadFilteredTeachers({}, 1, false);`);
  console.log('Replaced fetchInitialData logic.');
}

// 4. Expose loadFilteredTeachers and hasMoreTeachers to Marketplace
const marketplaceRegex = /<Marketplace\s*teachers=\{teachers\}\s*/;
if (content.match(marketplaceRegex)) {
  content = content.replace(marketplaceRegex, `<Marketplace 
                          teachers={teachers}
                          hasMoreTeachers={hasMoreTeachers}
                          loadFilteredTeachers={loadFilteredTeachers}
                          teachersPage={teachersPage}
                          `);
  console.log('Exposed to Marketplace component.');
}

fs.writeFileSync(appPath, content, 'utf8');
