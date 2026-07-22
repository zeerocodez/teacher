const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Imports
app = app.replace(
  "import { useState, useEffect, Suspense, lazy } from 'react';",
  "import { useState, useEffect, Suspense, lazy } from 'react';\nimport { Routes, Route, useNavigate, useLocation } from 'react-router-dom';"
);

// 2. Remove currentView state
const stateRegex = /const \[currentView, setCurrentView\] = useState\(\(\) => \{[\s\S]*?\}\);\s*/;
app = app.replace(stateRegex, "const navigate = useNavigate();\n  const location = useLocation();\n  ");

// 3. Replace setCurrentView calls
app = app.replace(/setCurrentView\('home'\)/g, "navigate('/')");
app = app.replace(/setCurrentView\('dashboard'\)/g, "navigate('/dashboard')");
app = app.replace(/setCurrentView\('teacher_profile'\)/g, "navigate('/teacher')");
app = app.replace(/setCurrentView\(saved \? 'dashboard' : 'home'\)/g, "navigate(saved ? '/dashboard' : '/')");

// 4. Replace currentView checks
app = app.replace(/currentView === 'home'/g, "location.pathname === '/'");
app = app.replace(/currentView !== 'home'/g, "location.pathname !== '/'");
app = app.replace(/currentView === 'dashboard'/g, "location.pathname.startsWith('/dashboard')");
app = app.replace(/currentView === 'teacher_profile'/g, "location.pathname.startsWith('/teacher')");

// 5. Replace the rendering structure (Routes)
const startMarker = "{/* Teacher Public Profile View */}";
const endMarker = "{/* Universal Footer */}";

const startIndex = app.indexOf(startMarker);
const endIndex = app.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find markers for routes");
  process.exit(1);
}

const routesComponent = `<main className="flex-1 w-full relative">
        <Routes>
          <Route path="/" element={
            <Home 
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
            />
          } />

          <Route path="/teacher" element={
            <Suspense fallback={<LoadingFallback />}>
              <TeacherPublicProfile 
                username={profileUsername}
                onBack={handleBackToHome}
                onBookClick={handleBookClick}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
                convertMinor={convertMinor}
                bookedSessions={bookedSessions}
              />
            </Suspense>
          } />

          <Route path="/dashboard" element={
            currentUser ? (
              isTutorOnboarding ? (
                <Suspense fallback={<LoadingFallback />}>
                  <TeacherOnboarding 
                    currentUser={currentUser}
                    onComplete={(profile) => {
                      setIsTutorOnboarding(false);
                      fetchInitialData();
                      alert("Your application is pending verification on the platform. Please check your email for updates.");
                    }}
                    onBack={() => navigate('/')}
                  />
                </Suspense>
              ) : (
                <div className="py-6 min-h-[75vh]">
                  <Suspense fallback={<LoadingFallback />}>
                    {currentUser.role === 'Admin' ? (
                      <AdminDashboard
                        currentUser={currentUser}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        onBack={() => navigate('/')}
                      />
                    ) : currentUser.role === 'Teacher' ? (
                      <TeacherDashboard
                        currentUser={currentUser}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        onOpenChat={handleOpenChat}
                        onGradeHomework={handleGradeHomework}
                        gradesLog={gradesLog}
                        onBack={() => navigate('/')}
                      />
                    ) : currentUser.role === 'Student' ? (
                      <StudentPortal
                        currentUser={currentUser}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        onBack={() => navigate('/')}
                      />
                    ) : (
                      <ParentDashboard 
                        currentUser={currentUser}
                        lang={lang}
                        t={t}
                        selectedCurrency={selectedCurrency}
                        formatCurrency={formatCurrency}
                        convertMinor={convertMinor}
                        gradesLog={gradesLog}
                        onGradeHomework={handleGradeHomework}
                        walletBalance={walletBalance}
                        escrowBalance={escrowBalance}
                        bookedSessions={bookedSessions}
                        onOpenChat={handleOpenChat}
                        pendingAssignments={pendingAssignments}
                        onTopupWallet={handleTopupWallet}
                        teachers={teachers}
                        onBookClick={handleBookClick}
                        onTeacherSelect={handleTutorProfileSelect}
                        onBack={() => navigate('/')}
                      />
                    )}
                  </Suspense>
                </div>
              )
            ) : null
          } />
        </Routes>
      </main>

      `;

app = app.substring(0, startIndex) + routesComponent + app.substring(endIndex);

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx router refactor complete.');
