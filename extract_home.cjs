const fs = require('fs');

const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

// Arrays are 0-indexed.
// Line 1505 is index 1504: <section className="relative h-[95dvh] ...">
// Line 2398 is index 2397: (empty line after </section>)
const homeContentLines = lines.slice(1504, 2398);
const homeContent = homeContentLines.join('\n');

const homeComponent = `import React, { Suspense } from 'react';
import { 
  ArrowRight, ShieldCheck, BookOpen, Star, Sparkles 
} from 'lucide-react';
import heroImage from '../assets/hero.jpg';

const Marketplace = React.lazy(() => import('../components/Marketplace'));
const SessionEngine = React.lazy(() => import('../components/SessionEngine'));
const Academy = React.lazy(() => import('../components/Academy'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12 w-full min-h-[200px]">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-dashed border-brand-clay rounded-full animate-spin" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-brand-moss font-bold">EB</span>
      </div>
    </div>
  );
}

export default function Home({
  t, scrollToSection, teachers, selectedCurrency, handleBookClick,
  formatCurrency, convertMinor, handleTutorProfileSelect,
  watchingTeacherVideo, setWatchingTeacherVideo, bookedSessions,
  handleEndSession, escrowBalance, currentUser, handleUnlockBadge,
  setAuthTab, setIsAuthOpen, waitlistName, setWaitlistName,
  waitlistEmail, setWaitlistEmail, waitlistRole, setWaitlistRole,
  handleWaitlistSubmit, waitlistStatus, openFaqIdx, setOpenFaqIdx
}) {
  return (
    <>
${homeContent}
    </>
  );
}
`;

fs.writeFileSync('src/pages/Home.jsx', homeComponent);

const newAppLines = [
  ...lines.slice(0, 1504),
  `          <Home 
            t={t}
            scrollToSection={scrollToSection}
            teachers={teachers}
            selectedCurrency={selectedCurrency}
            handleBookClick={handleBookClick}
            formatCurrency={formatCurrency}
            convertMinor={convertMinor}
            handleTutorProfileSelect={handleTutorProfileSelect}
            watchingTeacherVideo={watchingTeacherVideo}
            setWatchingTeacherVideo={setWatchingTeacherVideo}
            bookedSessions={bookedSessions}
            handleEndSession={handleEndSession}
            escrowBalance={escrowBalance}
            currentUser={currentUser}
            handleUnlockBadge={handleUnlockBadge}
            setAuthTab={setAuthTab}
            setIsAuthOpen={setIsAuthOpen}
            waitlistName={waitlistName}
            setWaitlistName={setWaitlistName}
            waitlistEmail={waitlistEmail}
            setWaitlistEmail={setWaitlistEmail}
            waitlistRole={waitlistRole}
            setWaitlistRole={setWaitlistRole}
            handleWaitlistSubmit={handleWaitlistSubmit}
            waitlistStatus={waitlistStatus}
            openFaqIdx={openFaqIdx}
            setOpenFaqIdx={setOpenFaqIdx}
          />`,
  ...lines.slice(2398)
];

const newAppContent = newAppLines.join('\n');
const finalAppContent = newAppContent.replace(
  "import BrandLogo from './components/BrandLogo';",
  "import BrandLogo from './components/BrandLogo';\nimport Home from './pages/Home';"
);

fs.writeFileSync('src/App.jsx', finalAppContent);

console.log('Successfully extracted Home.jsx and updated App.jsx');
