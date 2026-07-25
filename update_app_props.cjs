const fs = require('fs');
const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// Expose to Home
const homeRegex = /<Home\s+t=\{t\}\s+scrollToSection=\{scrollToSection\}\s+teachers=\{teachers\}/;
if (content.match(homeRegex)) {
  content = content.replace(homeRegex, `<Home 
                t={t}
                scrollToSection={scrollToSection}
                teachers={teachers}
                hasMoreTeachers={hasMoreTeachers}
                loadFilteredTeachers={loadFilteredTeachers}
                teachersPage={teachersPage}`);
  console.log('Exposed to Home');
}

// Expose to ParentDashboard
const parentDbRegex = /<ParentDashboard\s+currentUser=\{currentUser\}\s+lang=\{lang\}\s+t=\{t\}\s+selectedCurrency=\{selectedCurrency\}\s+formatCurrency=\{formatCurrency\}/;
if (content.match(parentDbRegex)) {
  content = content.replace(parentDbRegex, `<ParentDashboard 
                          currentUser={currentUser}
                          lang={lang}
                          t={t}
                          selectedCurrency={selectedCurrency}
                          formatCurrency={formatCurrency}
                          teachers={teachers}
                          hasMoreTeachers={hasMoreTeachers}
                          loadFilteredTeachers={loadFilteredTeachers}
                          teachersPage={teachersPage}`);
  console.log('Exposed to ParentDashboard');
}

fs.writeFileSync(appPath, content, 'utf8');
