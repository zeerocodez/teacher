const fs = require('fs');

// 1. Update Home.jsx
const homePath = 'src/pages/Home.jsx';
let homeContent = fs.readFileSync(homePath, 'utf8');

const homeFuncRegex = /export default function Home\(\{\s*t,\s*scrollToSection,\s*teachers,\s*selectedCurrency,\s*handleBookClick,\s*formatCurrency,\s*convertMinor,\s*handleTutorProfileSelect,\s*setWatchingTeacherVideo\s*\}\) \{/;
if (homeContent.match(homeFuncRegex)) {
  homeContent = homeContent.replace(homeFuncRegex, `export default function Home({ t, scrollToSection, teachers, hasMoreTeachers, loadFilteredTeachers, teachersPage, selectedCurrency, handleBookClick, formatCurrency, convertMinor, handleTutorProfileSelect, setWatchingTeacherVideo }) {`);
  console.log('Updated Home.jsx function signature');
}

const homeMarketplaceRegex = /<Marketplace\s+teachers=\{teachers\}\s+selectedCurrency=\{selectedCurrency\}/;
if (homeContent.match(homeMarketplaceRegex)) {
  homeContent = homeContent.replace(homeMarketplaceRegex, `<Marketplace 
            teachers={teachers} 
            hasMoreTeachers={hasMoreTeachers}
            loadFilteredTeachers={loadFilteredTeachers}
            teachersPage={teachersPage}
            selectedCurrency={selectedCurrency}`);
  console.log('Updated Home.jsx Marketplace props');
}

fs.writeFileSync(homePath, homeContent, 'utf8');

// 2. Update ParentDashboard.jsx
const parentPath = 'src/components/ParentDashboard.jsx';
let parentContent = fs.readFileSync(parentPath, 'utf8');

const parentFuncRegex = /export default function ParentDashboard\(\{\s*currentUser,\s*lang,\s*t,\s*selectedCurrency,\s*formatCurrency,\s*convertMinor,\s*onBack,\s*onBookSession\s*\}\)/;
if (parentContent.match(parentFuncRegex)) {
  parentContent = parentContent.replace(parentFuncRegex, `export default function ParentDashboard({ currentUser, lang, t, selectedCurrency, formatCurrency, convertMinor, onBack, onBookSession, teachers, hasMoreTeachers, loadFilteredTeachers, teachersPage })`);
  console.log('Updated ParentDashboard.jsx function signature');
}

const parentMarketplaceRegex = /<Marketplace\s+teachers=\{teachers\}\s+onBookClick=\{handleBookClick\}/;
if (parentContent.match(parentMarketplaceRegex)) {
  parentContent = parentContent.replace(parentMarketplaceRegex, `<Marketplace 
                          teachers={teachers}
                          hasMoreTeachers={hasMoreTeachers}
                          loadFilteredTeachers={loadFilteredTeachers}
                          teachersPage={teachersPage}
                          onBookClick={handleBookClick}`);
  console.log('Updated ParentDashboard.jsx Marketplace props');
}

fs.writeFileSync(parentPath, parentContent, 'utf8');
