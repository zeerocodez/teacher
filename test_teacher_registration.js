import fs from 'fs';

async function testTeacherRegistration() {
  console.log("🚀 Starting Teacher Registration Test...");
  const uniqueId = Date.now();
  const testEmail = `teacher_${uniqueId}@test.com`;

  try {
    // 1. Register a new user
    console.log(`\n📝 1. Registering new teacher account (${testEmail})...`);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        displayName: 'Dr. Test Registration',
        role: 'Teacher',
        password: 'Password123!',
        country: 'Nigeria',
        username: `dr-test-${uniqueId}`
      })
    });
    
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.error || 'Registration failed');
    
    console.log("✅ Registration successful!");
    console.log("Received Token:", regData.token.substring(0, 20) + "...");
    
    // Check if user is nested or at root
    const uid = regData.user ? regData.user.uid : regData.uid;
    console.log("User UID:", uid);

    // 2. Complete Onboarding
    console.log(`\n🚀 2. Submitting teacher onboarding profile...`);
    const onboardRes = await fetch('http://localhost:5000/api/teachers/onboard', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      },
      body: JSON.stringify({
        uid: uid,
        name: 'Dr. Test Registration',
        username: `dr-test-${uniqueId}`,
        bio: 'I am a highly experienced math tutor ready to teach on EduVista!',
        subjects: ['Mathematics', 'Physics'],
        rate: 5000,
        currency: 'NGN'
      })
    });

    const onboardData = await onboardRes.json();
    if (!onboardRes.ok) throw new Error(onboardData.error || 'Onboarding failed');
    
    console.log("✅ Onboarding successful!");
    console.log("Profile Status:", onboardData.status);

    // 3. Check Emails
    console.log(`\n📧 3. Checking sent emails log...`);
    // wait a brief moment for async email writes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const emailLog = JSON.parse(fs.readFileSync('server/data/sent_emails.json', 'utf8'));
      const recentEmails = emailLog.slice(-3); // Get last 3 emails
      
      console.log(`Found ${emailLog.length} total emails in log. Recent emails sent:`);
      recentEmails.forEach((email, i) => {
        console.log(`\n--- Email ${i + 1} ---`);
        console.log(`To: ${email.to}`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Body Snippet: ${email.body.substring(0, 100).replace(/\n/g, ' ')}...`);
      });
    } catch (e) {
      console.log("Could not read sent_emails.json. They might not be written yet or an error occurred.", e.message);
    }

  } catch (err) {
    console.error("\n❌ Test Failed:", err.message);
  }
}

testTeacherRegistration();
