const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Add import
app = app.replace(
  "import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';",
  "import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';\nimport toast from 'react-hot-toast';"
);

// Replace specific alerts
app = app.replace(
  /alert\(\`Booking sessions with demo content tutors is disabled\. Redirecting you to book our verified tutor, \$\{realTutor\.name\}\.\`\);/g,
  "toast.error(`Booking sessions with demo content tutors is disabled. Redirecting you to book our verified tutor, ${realTutor.name}.`);"
);

app = app.replace(
  /alert\("Booking sessions with demo content tutors is disabled\. Please register a real teacher account to book classes\."\);/g,
  "toast.error(\"Booking sessions with demo content tutors is disabled. Please register a real teacher account to book classes.\");"
);

app = app.replace(
  /alert\(\`Booking payment failed: \$\{errData\.error \|\| "Payment gateway error"\}\`\);/g,
  "toast.error(`Booking payment failed: ${errData.error || \"Payment gateway error\"}`);"
);

app = app.replace(
  /alert\(\`Booking failed: \$\{errData\.error\}\`\);/g,
  "toast.error(`Booking failed: ${errData.error}`);"
);

app = app.replace(
  /alert\(\`Payment initialization failed: \$\{err\.message \|\| "Please check your connection\."\}\`\);/g,
  "toast.error(`Payment initialization failed: ${err.message || \"Please check your connection.\"}`);"
);

app = app.replace(
  /alert\(\`Top-up failed: \$\{errData\.error \|\| "Payment gateway error"\}\`\);/g,
  "toast.error(`Top-up failed: ${errData.error || \"Payment gateway error\"}`);"
);

app = app.replace(
  /alert\(\`Failed to complete session: \$\{errData\.error\}\`\);/g,
  "toast.error(`Failed to complete session: ${errData.error}`);"
);

app = app.replace(
  /alert\("Your application is pending verification on the platform\. Please check your email for updates\."\);/g,
  "toast.success(\"Your application is pending verification on the platform. Please check your email for updates.\");"
);

fs.writeFileSync('src/App.jsx', app);
console.log("Alerts replaced with toast.");
