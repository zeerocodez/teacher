import fs from 'fs';

async function testParentRegistration() {
  console.log("🚀 Starting Parent Registration Test...");
  const uniqueId = Date.now();
  const testEmail = `parent_${uniqueId}@test.com`;

  try {
    // 1. Register a new parent
    console.log(`\n📝 1. Registering new parent account (${testEmail})...`);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        displayName: 'Mr. John Doe (Parent)',
        role: 'Parent',
        password: 'Password123!',
        country: 'Nigeria'
      })
    });
    
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.error || 'Registration failed');
    
    console.log("✅ Registration successful!");
    
    const uid = regData.user ? regData.user.uid : regData.uid;
    console.log("Parent UID:", uid);

    // 2. Check Emails
    console.log(`\n📧 2. Checking sent emails log...`);
    // wait a brief moment for async email writes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const emailLog = JSON.parse(fs.readFileSync('server/data/sent_emails.json', 'utf8'));
      const recentEmails = emailLog.slice(-4); // Get last 4 emails
      
      console.log(`Found ${emailLog.length} total emails in log. Recent emails sent:`);
      recentEmails.forEach((email, i) => {
        console.log(`\n--- Email ${i + 1} ---`);
        console.log(`To: ${email.to}`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Template: ${email.template}`);
        console.log(`Body Snippet: ${email.body.substring(0, 100).replace(/\n/g, ' ')}...`);
      });
    } catch (e) {
      console.log("Could not read sent_emails.json. They might not be written yet or an error occurred.", e.message);
    }

  } catch (err) {
    console.error("\n❌ Test Failed:", err.message);
  }
}

testParentRegistration();
