const fs = require('fs');

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

const newInitialState = `  const [teachers, setTeachers] = useState([
    {
      id: "teacher_1",
      uid: "teacher_1",
      username: "adebayo",
      name: "Mr. Adebayo Okafor",
      location: "Lagos, Nigeria",
      subjects: ["Mathematics", "Physics"],
      curriculums: ["WAEC", "JAMB", "IGCSE", "High School (Ages 15-18)", "University Prep", "Adult Education"],
      rate: 400000,
      rating: 4.9,
      reviewsCount: 247,
      badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
      bio: "12 years teaching mathematics preparation. Specializes in algebra speed calculations and IGCSE/WAEC exam setups.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Kehinde A.", text: "Excellent algebra prep. Tunde passed his WAEC with an A1!", score: 5 },
        { parent: "Sarah M.", text: "Great physics explanations. Highly recommend.", score: 5 }
      ]
    },
    {
      id: "teacher_2",
      uid: "teacher_2",
      username: "chioma",
      name: "Ms. Chioma Eze",
      location: "Abuja, Nigeria",
      subjects: ["English", "Literature"],
      curriculums: ["WAEC", "IGCSE", "Primary (Ages 6-10)", "Middle School (Ages 11-14)"],
      rate: 350000,
      rating: 4.8,
      reviewsCount: 156,
      badges: ["badge-verified", "badge-bg-checked"],
      bio: "Dedicated English educator focused on reading comprehension and creative writing skills. Over 8 years of experience with international curricula.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Ngozi A.", text: "My daughter loves her lessons. Her reading has improved drastically.", score: 5 }
      ]
    },
    {
      id: "teacher_3",
      uid: "teacher_3",
      username: "femi",
      name: "Dr. Femi Ojo",
      location: "Port Harcourt, Nigeria",
      subjects: ["Chemistry", "Biology"],
      curriculums: ["JAMB", "WAEC", "A-Levels", "University Prep"],
      rate: 500000,
      rating: 5.0,
      reviewsCount: 89,
      badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
      bio: "Former university lecturer with a PhD in Biochemistry. I break down complex scientific concepts into easy-to-understand real-world applications.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop",
      online: false,
      reviews: [
        { parent: "Emeka O.", text: "The best science tutor we've ever had. Truly exceptional.", score: 5 }
      ]
    }
  ]);`;

// Regex to replace the entire useState array for teachers
const regex = /const \[teachers, setTeachers\] = useState\(\[\s*\{\s*id: "teacher_1"[\s\S]*?\}\s*\]\);/;

if (content.match(regex)) {
  content = content.replace(regex, newInitialState);
  console.log('Replaced teachers state.');
} else {
  console.log('Could not find teachers state.');
}

// 2. Modify fetchInitialData
const fetchRegex = /latestTeachers = teachersData\.map\([\s\S]*?\}\)\);\s*setTeachers\(latestTeachers\);\s*\}/;

const fetchReplacement = `latestTeachers = teachersData.map(t => ({
            ...t,
            id: t.uid || t.id,
            subjects: t.subjects || [],
            curriculums: t.curricula || t.curriculums || [],
            reviews: t.reviews || []
          }));
          const demoUids = ['teacher_1', 'teacher_2', 'teacher_3', 'teacher_4', 'teacher_5', 'teacher_test_pay'];
          const realTeachers = latestTeachers.filter(t => !demoUids.includes(t.uid));
          if (realTeachers.length > 0) {
            setTeachers(realTeachers);
          }
        }`;

if (content.match(fetchRegex)) {
  content = content.replace(fetchRegex, fetchReplacement);
  console.log('Replaced fetchInitialData logic.');
} else {
  console.log('Could not find fetchInitialData logic.');
}

fs.writeFileSync(appPath, content, 'utf8');
