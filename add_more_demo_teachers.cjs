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
    },
    {
      id: "teacher_4",
      uid: "teacher_4",
      username: "grace",
      name: "Mrs. Grace Ojo",
      location: "Ibadan, Nigeria",
      subjects: ["Basic Literacy", "Numeracy", "Phonics"],
      curriculums: ["Early Years Foundation Stage (EYFS)", "Nursery", "Primary (Ages 6-10)"],
      rate: 250000,
      rating: 4.9,
      reviewsCount: 112,
      badges: ["badge-verified", "badge-bg-checked"],
      bio: "Early childhood education specialist. I use play-based learning and interactive phonics to build a strong foundation for young learners.",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1bfa82?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Aisha M.", text: "My 5-year-old looks forward to her phonics classes every week!", score: 5 }
      ]
    },
    {
      id: "teacher_5",
      uid: "teacher_5",
      username: "samuel",
      name: "Mr. Samuel Kalu",
      location: "Enugu, Nigeria",
      subjects: ["General Science", "Basic Mathematics"],
      curriculums: ["Primary (Ages 6-10)", "Montessori"],
      rate: 200000,
      rating: 4.8,
      reviewsCount: 95,
      badges: ["badge-verified"],
      bio: "Passionate about making math and science fun for kids. I integrate visual aids and Montessori methods to engage young minds.",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Chukwudi E.", text: "He has a great way of explaining fractions to my 8-year-old.", score: 5 }
      ]
    },
    {
      id: "teacher_6",
      uid: "teacher_6",
      username: "amina",
      name: "Miss Amina Bello",
      location: "Kano, Nigeria",
      subjects: ["Creative Arts", "English Reading", "Handwriting"],
      curriculums: ["Nursery", "Primary (Ages 6-10)"],
      rate: 150000,
      rating: 4.7,
      reviewsCount: 78,
      badges: ["badge-verified", "badge-bg-checked"],
      bio: "Patient and encouraging tutor for nursery and early primary students. Specializes in helping kids develop excellent reading habits and fine motor skills.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop",
      online: false,
      reviews: [
        { parent: "Fatima S.", text: "Her handwriting improvement techniques are amazing.", score: 4 }
      ]
    }
  ]);`;

// Regex to replace the entire useState array for teachers
const regex = /const \[teachers,\s*setTeachers\] = useState\(\[\s*\{\s*id: "teacher_1"[\s\S]*?\}\s*\]\);/;

if (content.match(regex)) {
  content = content.replace(regex, newInitialState);
  console.log('Replaced teachers state.');
} else {
  console.log('Could not find teachers state. It might have been modified.');
}

// Ensure teacher_6 is in the demoUids array in fetchInitialData
const fetchRegex = /const demoUids = \['teacher_1', 'teacher_2', 'teacher_3', 'teacher_4', 'teacher_5', 'teacher_test_pay'\];/;
const fetchReplacement = `const demoUids = ['teacher_1', 'teacher_2', 'teacher_3', 'teacher_4', 'teacher_5', 'teacher_6', 'teacher_test_pay'];`;

if (content.match(fetchRegex)) {
  content = content.replace(fetchRegex, fetchReplacement);
  console.log('Updated demoUids array in fetchInitialData.');
} else {
  console.log('Could not find demoUids array.');
}

// Ensure teacher_6 is in the isDemoTutor check
const demoCheckRegex = /const demoUids = \['teacher_1', 'teacher_2', 'teacher_3', 'teacher_4', 'teacher_5', 'teacher_test_pay'\];/g;
content = content.replace(demoCheckRegex, fetchReplacement);

fs.writeFileSync(appPath, content, 'utf8');
