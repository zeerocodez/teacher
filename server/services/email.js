import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

let DATA_DIR = path.join(process.cwd(), 'server', 'data');

// Ensure data directory exists (robust fallback to /tmp for read-only environments)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Read-only filesystem detected for email service, falling back to /tmp/eduvistar_data");
  DATA_DIR = path.join('/tmp', 'eduvistar_data');
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (tmpErr) {
    console.error("Failed to create temp directory for email service:", tmpErr);
  }
}

const EMAIL_LOG_FILE = path.join(DATA_DIR, 'sent_emails.json');
const APP_URL = (process.env.CLIENT_ORIGIN || process.env.APP_URL || 'https://www.eduvistar.com').replace(/\/$/, '');

// Helper to read sent emails log
export function readSentEmails() {
  if (!fs.existsSync(EMAIL_LOG_FILE)) {
    try {
      fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify([], null, 2));
    } catch (err) {
      console.error("Error creating sent emails file:", err.message);
    }
    return [];
  }
  try {
    const data = fs.readFileSync(EMAIL_LOG_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading sent emails file:", err);
    return [];
  }
}

// Helper to write sent emails log
function writeSentEmails(emails) {
  try {
    fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify(emails, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing sent emails file:", err);
    return false;
  }
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.resend.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER || 'resend';
    const pass = process.env.SMTP_PASS || '';

    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }
  return transporter;
}

/**
 * HTML Email Styling Wrapper
 */
function getHtmlWrapper(title, contentHtml) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #F2F0E9; color: #1A1A1A; margin: 0; padding: 20px; }
          .container { max-width: 600px; background-color: #ffffff; border: 1px solid rgba(46,64,54,0.1); border-radius: 24px; overflow: hidden; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .header { background-color: #2E4036; padding: 30px 20px; text-align: center; }
          .header h1 { color: #F2F0E9; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; }
          .content { padding: 40px 30px; font-size: 15px; line-height: 1.6; color: #1A1A1A; }
          .footer { background-color: #1A1A1A; color: #F2F0E9; text-align: center; padding: 20px; font-size: 11px; }
          .button { display: inline-block; background-color: #CC5833; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: bold; margin-top: 20px; }
          .badge { display: inline-block; background-color: rgba(204,88,51,0.1); color: #CC5833; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          ul { padding-left: 20px; margin: 15px 0; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EduVistar</h1>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>SYSTEM ACTIVE // ESCROW PROTECTED // SECURED BY GEMINI AI</p>
            <p>© 2026 EduVistar Africa. A product of Zeerocodes Automation Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Zeptomail REST API Sender
 */
async function sendViaZeptomailAPI(to, subject, textBody, htmlBody) {
  const apiKey = process.env.ZEPTOMAIL_API_KEY;
  const fromEmail = process.env.ZEPTOMAIL_SENDER_EMAIL || 'onboarding@zeptomail.com';
  const fromName = process.env.ZEPTOMAIL_SENDER_NAME || 'EduVistar';
  
  const payload = {
    from: {
      address: fromEmail,
      name: fromName
    },
    to: [
      {
        email_address: {
          address: to,
          name: to.split('@')[0]
        }
      }
    ],
    subject: subject,
    htmlbody: htmlBody,
    textbody: textBody
  };

  const res = await fetch('https://api.zeptomail.com/v1.1/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Zoho-enczapikey ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Zeptomail API failed with status ${res.status}: ${errorText}`);
  }

  return await res.json();
}

/**
 * Sends a transactional email by logging it in the console, writing to sent_emails.json, and sending via SMTP or Zeptomail REST API.
 */
export function sendTransactionalEmail(to, subject, templateName, templateData) {
  const emailId = `email_${crypto.randomUUID()}`;
  const sentAt = new Date().toISOString();

  let body = '';
  let htmlBody = '';

  if (templateName === 'welcome') {
    const verificationUrl = `${APP_URL}/verify-email?token=${crypto.randomBytes(16).toString('hex')}`;
    
    if (templateData.role === 'Teacher') {
      const dashboardUrl = `${APP_URL}/dashboard`;
      body = `Welcome to EduVistar Africa, ${templateData.displayName}!\n\nYour educator account is active. You can now access your Teacher Dashboard.\n\nNext Steps to Complete Your Registration & Start Receiving Students:\n1. Log In to Dashboard: ${dashboardUrl}\n2. Set Your Subjects & Hourly Rates: Choose the curriculum and set your hourly rate in your Profile.\n3. Upload Verification Credentials: Submit your Government ID and Degree/Certification under Profile Settings to unlock verified status.\n4. Admin Vetting: Our academic team audits credentials within 24-48 hours. Once verified, parents can directly book private lessons with you.\n\nBest regards,\nEduVistar Africa Academic Support`;
      htmlBody = getHtmlWrapper(subject, `
        <div style="text-align: center; margin-bottom: 25px;">
          <span class="badge" style="letter-spacing: 1px; text-transform: uppercase;">Educator Portal Active</span>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 24px; color: #2E4036; margin-top: 0; line-height: 1.3; font-weight: bold;">Welcome to the EduVistar Faculty, ${templateData.displayName}!</h2>
        <p>Congratulations on joining Africa's premier network of verified educators. Your account is active and ready for your teaching journey.</p>
        
        <div style="background-color: #F9F8F6; border: 1px solid rgba(46,64,54,0.08); border-radius: 16px; padding: 22px; margin: 25px 0;">
          <h3 style="color: #2E4036; font-size: 15px; margin-top: 0; font-weight: bold; margin-bottom: 12px;">Next Steps to Complete Verification & Accept Clients:</h3>
          <ol style="padding-left: 20px; margin: 0; color: #1A1A1A; line-height: 1.7; font-size: 14px;">
            <li style="margin-bottom: 10px;"><strong>Access Your Portal:</strong> Log in directly to your <a href="${dashboardUrl}" style="color: #CC5833; font-weight: bold; text-decoration: underline;">Teacher Dashboard</a>.</li>
            <li style="margin-bottom: 10px;"><strong>Configure Subjects & Hourly Rate:</strong> Select the curriculum levels you teach (WAEC, Cambridge, IGCSE) and set your hourly tutoring fees.</li>
            <li style="margin-bottom: 10px;"><strong>Upload Verification Documents:</strong> Under Profile Settings, submit your Government ID and Degree/Teaching certificates to gain your verified badge.</li>
            <li style="margin-bottom: 0;"><strong>Start Receiving Bookings:</strong> Once audited, your profile will go live to thousands of parents. All tutoring sessions are protected by our automated Escrow Engine.</li>
          </ol>
        </div>

        <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5; font-style: italic; margin-bottom: 30px;">
          EduVistar guarantees 100% timely payouts into your local bank or mobile wallet upon successful lesson completion.
        </p>
        
        <div style="text-align: center;">
          <a class="button" href="${dashboardUrl}">Go to Teacher Dashboard</a>
        </div>
        <p style="margin-top: 30px; font-size: 14px;">Warm regards,<br>The EduVistar Academic Team</p>
      `);
    } else {
      body = `Welcome to EduVistar Africa, ${templateData.displayName}!\n\nYour parental hub has been successfully created.\n\nHere is what you can expect and your next steps:\n\n1. Verify Email: ${verificationUrl}\n2. Top Up Wallet: Add funds to your secure wallet to pay for lessons.\n3. Discover Tutors: Browse vetted educators by subject, rate, and curriculum.\n4. Book Lessons: Schedule 1-on-1 virtual sessions securely.\n\nEvery lesson is backed by the EduVistar Escrow System.\n\nIf a tutor is a no-show, experiences continuous connectivity failures, or files incorrect hours, you can register a dispute within 48 hours of lesson completion. Escrow funds are immediately frozen pending manual administrator reviews.\n\nBest regards,\nEduVistar Africa Support`;
      htmlBody = getHtmlWrapper(subject, `
        <div style="text-align: center; margin-bottom: 25px;">
          <span class="badge" style="letter-spacing: 1px; text-transform: uppercase;">Parental Hub</span>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 24px; color: #2E4036; margin-top: 0; line-height: 1.3; font-weight: bold;">Unlocking Academic Excellence.</h2>
        <p>Welcome to EduVistar Africa, <strong>${templateData.displayName}</strong>. Your family portal has been successfully created.</p>
        
        <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Here is exactly what you can expect and your next steps to get started with finding the perfect tutor for your child:</p>

        <div style="background-color: #F9F8F6; border: 1px solid rgba(46,64,54,0.08); border-radius: 16px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #2E4036; font-size: 15px; margin-top: 0; font-weight: bold;">Step-by-Step Instructions:</h3>
          <ol style="padding-left: 20px; margin: 0; color: #1A1A1A; line-height: 1.6;">
            <li style="margin-bottom: 8px;"><strong>Verify Email:</strong> First, secure your account credentials by clicking the verification link below.</li>
            <li style="margin-bottom: 8px;"><strong>Top Up Wallet:</strong> Add funds to your secure digital wallet. These funds will be used to safely book tutors.</li>
            <li style="margin-bottom: 8px;"><strong>Discover Educators:</strong> Browse and filter our strictly vetted tutors based on subject, curriculum, and rate.</li>
            <li style="margin-bottom: 0;"><strong>Book Lessons:</strong> Schedule interactive 1-on-1 virtual sessions.</li>
          </ol>
        </div>

        <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5; font-style: italic; margin-bottom: 30px;">
          <strong>What to expect during a session:</strong> Every lesson is backed by the EduVistar Escrow System — your funds are safely locked when booking, and are only released to the tutor once the classroom timer records a successful lesson completion.
          <br><br>
          If a tutor is a no-show, experiences continuous connectivity failures, or files incorrect hours, you can register a dispute within 48 hours of lesson completion. Escrow funds are immediately frozen pending manual administrator reviews.
        </p>
        
        <div style="text-align: center;">
          <a class="button" href="${verificationUrl}">Verify Account & Explore Tutors</a>
        </div>
        <p style="margin-top: 30px; font-size: 14px;">Warm regards,<br>The EduVistar Team</p>
      `);
    }
  } else if (templateName === 'booking_secured') {
    body = `Hello Parent,\n\nYour session with ${templateData.teacherName} has been booked. A payment of ${templateData.formattedCost} has been safely locked in the EduVistar Timed Escrow Engine for the slot: ${templateData.slot.day} at ${templateData.slot.time}.\n\nEscrow details: ${APP_URL}/dashboard/billing\n\nThanks,\nEduVistar Billing`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Escrow Payment Secured</h2>
      <p>Hello Parent,</p>
      <p>Your 1-on-1 private lesson session with <strong>${templateData.teacherName}</strong> has been booked. A payment of <strong>${templateData.formattedCost}</strong> has been safely locked in the EduVistar Timed Escrow Engine for the slot: <strong>${templateData.slot.day} at ${templateData.slot.time}</strong>.</p>
      <p><a class="button" href="${APP_URL}/dashboard/billing">View Escrow Details</a></p>
      <p>Thanks,<br>EduVistar Billing</p>
    `);
  } else if (templateName === 'booking_received') {
    body = `Hello Teacher,\n\nYou have received a new tutoring request from Parent ${templateData.parentName} for student ${templateData.studentName}.\n\nDetails:\n- Subject: ${templateData.subject}\n- Syllabus: ${templateData.curriculum}\n- Slot: ${templateData.slot.day} at ${templateData.slot.time}\n- Payout Share: ${templateData.formattedPayout}\n\nPlease respond to this request in your dashboard: ${APP_URL}/dashboard\n\nThanks,\nEduVistar Team`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>New Session Booking Request</h2>
      <p>Hello Teacher,</p>
      <p>You have received a new 1-on-1 online tutoring request from parent <strong>${templateData.parentName}</strong> for student <strong>${templateData.studentName}</strong>.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Subject: ${templateData.subject}</li>
        <li>Syllabus: ${templateData.curriculum}</li>
        <li>Time: ${templateData.slot.day} at ${templateData.slot.time}</li>
        <li>Your Payout Share: <strong>${templateData.formattedPayout}</strong></li>
      </ul>
      <p>Please review and accept/decline this session request from your dashboard.</p>
      <p><a class="button" href="${APP_URL}/dashboard">Respond to Request</a></p>
    `);
  } else if (templateName === 'booking_confirmed') {
    body = `Hello Parent,\n\nGreat news! Your booking request with private tutor ${templateData.teacherName} has been confirmed for ${templateData.slot.day} at ${templateData.slot.time}. Your classroom is now scheduled.\n\nOpen dashboard: ${APP_URL}/dashboard\n\nWarm regards,\nEduVistar Support`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Lessons Scheduled!</h2>
      <p>Hello Parent,</p>
      <p>Great news! Your booking request with private tutor <strong>${templateData.teacherName}</strong> has been confirmed for <strong>${templateData.slot.day} at ${templateData.slot.time}</strong>. Your online classroom link is now active.</p>
      <p><a class="button" href="${APP_URL}/dashboard">Open Parent Portal</a></p>
      <p>Warm regards,<br>EduVistar Support</p>
    `);
  } else if (templateName === 'booking_rejected') {
    body = `Hello Parent,\n\nYour booking request with tutor ${templateData.teacherName} has been declined. The escrow amount of ${templateData.formattedCost} has been fully refunded back to your wallet balance.\n\nCheck billing: ${APP_URL}/dashboard\n\nEduVistar Billing`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Booking Request Declined</h2>
      <p>Hello Parent,</p>
      <p>Your booking request with private tutor <strong>${templateData.teacherName}</strong> has been declined. The escrow amount of <strong>${templateData.formattedCost}</strong> has been fully refunded back to your wallet balance.</p>
      <p><a class="button" href="${APP_URL}/dashboard">Open Parent Portal</a></p>
      <p>Warm regards,<br>EduVistar Billing</p>
    `);
  } else if (templateName === 'session_completed') {
    body = `Hello Parent,\n\nYour private online lesson with tutor ${templateData.teacherName} is complete. The server classroom timer recorded a duration of 58 minutes. Escrow funds have been settled.\n\nView AI report: ${APP_URL}/dashboard/progress`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Tutoring Session Complete</h2>
      <p>Hello Parent,</p>
      <p>Your private online lesson with tutor <strong>${templateData.teacherName}</strong> is complete. The server classroom timer recorded a duration of <strong>58 minutes</strong>. Escrow funds have been settled.</p>
      <p><a class="button" href="${APP_URL}/dashboard/progress">View Student Progress</a></p>
    `);
  } else if (templateName === 'escrow_released') {
    body = `Hello Teacher,\n\nYour session payment has been settled! A payout of ${templateData.formattedPayout} has been released and transferred to your wallet balance (commission fee: ${templateData.formattedCommission}).\n\nOpen wallet: ${APP_URL}/dashboard`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Escrow Funds Released</h2>
      <p>Hello Teacher,</p>
      <p>Your session payment has been settled! A payout of <strong>${templateData.formattedPayout}</strong> has been released and transferred to your wallet balance (commission fee: ${templateData.formattedCommission}).</p>
      <p><a class="button" href="${APP_URL}/dashboard">View Wallet Balance</a></p>
    `);
  } else if (templateName === 'assignment_submitted') {
    body = `Hello Teacher,\n\nStudent ${templateData.studentName} has submitted homework for review.\n\nAssignment: "${templateData.title}"\nSubmitted At: ${templateData.submittedAt}\n\nPlease grade the submission: ${APP_URL}/dashboard`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Homework Assignment Submitted</h2>
      <p>Hello Teacher,</p>
      <p>Student <strong>${templateData.studentName}</strong> has submitted homework for review.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Assignment: "${templateData.title}"</li>
        <li>Submitted At: ${templateData.submittedAt}</li>
      </ul>
      <p>Please grade the submission in your dashboard.</p>
      <p><a class="button" href="${APP_URL}/dashboard">Grade Assignment</a></p>
    `);
  } else if (templateName === 'assignment_graded') {
    body = `Hi Parent,\n\nAn assignment score card has been posted for ${templateData.studentName}.\n\nAssignment: "${templateData.title}"\nGrade: ${templateData.score}/100\nFeedback: "${templateData.feedback}"\n\nCheck detailed grades: ${APP_URL}/dashboard/progress`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Homework Score Card Ready</h2>
      <p>Hi Parent,</p>
      <p>An assignment score card has been posted for <strong>${templateData.studentName}</strong>.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Assignment: "${templateData.title}"</li>
        <li>Grade: <span class="badge">${templateData.score}/100</span></li>
        <li>Teacher Feedback: "${templateData.feedback}"</li>
      </ul>
      <p><a class="button" href="${APP_URL}/dashboard/progress">View Student Progress</a></p>
    `);
  } else if (templateName === 'payout_approved') {
    body = `Hello Teacher,\n\nYour payout request has been approved! The amount of ${templateData.formattedAmount} is being processed and sent to your bank card/mobile money wallet.\n\nOpen wallet: ${APP_URL}/dashboard`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Payout Request Approved</h2>
      <p>Hello Teacher,</p>
      <p>Your payout request has been approved! The amount of <strong>${templateData.formattedAmount}</strong> is being processed and sent to your bank card/mobile money wallet.</p>
      <p><a class="button" href="${APP_URL}/dashboard">Go to Wallet</a></p>
    `);
  } else if (templateName === 'payout_rejected') {
    body = `Hello Teacher,\n\nYour payout request for ${templateData.formattedAmount} was declined.\n\nReason: "${templateData.reason}"\n\nThe funds have been returned to your wallet balance.`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Payout Request Declined</h2>
      <p>Hello Teacher,</p>
      <p>Your payout request for <strong>${templateData.formattedAmount}</strong> was declined.</p>
      <p><strong>Reason:</strong> "${templateData.reason}"</p>
      <p>The funds have been returned to your wallet balance.</p>
      <p><a class="button" href="${APP_URL}/dashboard">View Details</a></p>
    `);
  } else if (templateName === 'dispute_created') {
    body = `Hello,\n\nA billing dispute has been opened for the session on ${templateData.slot.day} at ${templateData.slot.time} by Parent ${templateData.parentName}.\n\nDispute Reason: "${templateData.reason}"\n\nFunds are locked in dispute escrow. Admin will review within 24 hours.`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>Billing Dispute Opened</h2>
      <p>Hello,</p>
      <p>A billing dispute has been opened for the session on <strong>${templateData.slot.day} at ${templateData.slot.time}</strong> by Parent <strong>${templateData.parentName}</strong>.</p>
      <p><strong>Dispute Reason:</strong></p>
      <p><em>"${templateData.reason}"</em></p>
      <p>Funds are locked in dispute escrow. An administrator will review within 24 hours.</p>
    `);
  } else if (templateName === 'wallet_topup') {
    body = `Hello ${templateData.displayName},\n\nYour wallet top-up of ${templateData.formattedAmount} was successful!\n\nReference: ${templateData.reference}\nDate: ${new Date().toLocaleString()}\n\nThank you for using EduVistar,\nEduVistar Billing`;
    htmlBody = getHtmlWrapper(subject, `
      <div style="text-align: center; margin-bottom: 25px;">
        <span class="badge" style="letter-spacing: 1px; text-transform: uppercase;">Payment Confirmed</span>
      </div>
      <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 24px; color: #2E4036; margin-top: 0; line-height: 1.3; font-weight: bold;">Wallet Top-up Successful.</h2>
      <p>Hello <strong>${templateData.displayName}</strong>,</p>
      <p>We are pleased to confirm that a deposit of <strong>${templateData.formattedAmount}</strong> has been successfully credited to your wallet balance.</p>
      
      <div style="background-color: #F9F8F6; border: 1px solid rgba(46,64,54,0.08); border-radius: 16px; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #4A4A4A;"><strong>Transaction Ref:</strong></td>
            <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #1A1A1A;">${templateData.reference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4A4A4A;"><strong>Amount:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #2E4036; font-weight: bold;">${templateData.formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4A4A4A;"><strong>Payment Gateway:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #1A1A1A; text-transform: capitalize;">${templateData.paymentProcessor || 'Paystack'}</td>
          </tr>
        </table>
      </div>

      <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
        These funds are now available in your wallet and can be used immediately to book 1-on-1 private lesson sessions.
      </p>

      <div style="text-align: center;">
        <a class="button" href="${APP_URL}/dashboard/billing">View Wallet Balance</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px;">Best regards,<br>EduVistar Billing</p>
    `);
  } else if (templateName === 'admin_notification' || templateName === 'custom' || templateName === 'alert') {

    body = `Dear ${templateData.displayName || 'User'},\n\nWe have a new update for you regarding your EduVistar account:\n\n${templateData.message}\n\nTo view this update and take action, please log in to your dashboard at ${APP_URL}/\n\nWarm regards,\nEduVistar Administration`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>EduVistar Administration Update</h2>
      <p>Dear ${templateData.displayName || 'User'},</p>
      <p>We have a new update for you regarding your EduVistar account:</p>
      <p style="background-color: #f7f7f7; padding: 15px; border-radius: 8px; font-style: italic;">
        "${templateData.message}"
      </p>
      <p>To view this update and take action, please log in to your dashboard:</p>
      <p><a class="button" href="${APP_URL}/">Log In to Dashboard</a></p>
      <p>Warm regards,<br>EduVistar Administration</p>
    `);
  } else {
    body = `Subject: ${subject}\nData: ${JSON.stringify(templateData)}`;
    htmlBody = getHtmlWrapper(subject, `
      <h2>EduVistar Alert</h2>
      <p><strong>Subject:</strong> ${subject}</p>
      <pre style="background-color: #f7f7f7; padding: 15px; border-radius: 8px;">${JSON.stringify(templateData, null, 2)}</pre>
    `);
  }

  const emailRecord = {
    id: emailId,
    to,
    subject,
    template: templateName,
    body,
    htmlBody,
    data: templateData,
    sentAt,
    status: 'pending'
  };

  // 1. Write to local sent_emails.json log
  const sentEmails = readSentEmails();
  sentEmails.push(emailRecord);
  writeSentEmails(sentEmails);

  // 2. Print beautiful ASCII card to terminal for local auditing
  console.log(`
┌────────────────────────────────────────────────────────────┐
│                  EDUVISTAR TRANS-EMAIL LOG                 │
├────────────────────────────────────────────────────────────┤
│ ID:      ${emailId.substring(0, 32)}...
│ TO:      ${to}
│ SUBJECT: ${subject}
│ TEMPLATE: ${templateName}
│ SENT AT: ${sentAt}
├────────────────────────────────────────────────────────────┤
${body.split('\n').map(line => `│ ${line.padEnd(58).substring(0, 58)}│`).join('\n')}
└────────────────────────────────────────────────────────────┘
  `);

  // 3. Send email via Zeptomail API or SMTP
  if (process.env.ZEPTOMAIL_API_KEY) {
    // A. Send via Zeptomail REST API
    sendViaZeptomailAPI(to, subject, body, htmlBody)
      .then(info => {
        console.log(`[Zeptomail API] Email successfully sent to ${to} (Resp: ${JSON.stringify(info)})`);
        const currentEmails = readSentEmails();
        const idx = currentEmails.findIndex(e => e.id === emailId);
        if (idx !== -1) {
          currentEmails[idx].status = 'sent';
          currentEmails[idx].provider = 'zeptomail_api';
          currentEmails[idx].providerResponse = info;
          writeSentEmails(currentEmails);
        }
      })
      .catch(err => {
        console.error(`[Zeptomail API] Failed to send email to ${to}:`, err);
        const currentEmails = readSentEmails();
        const idx = currentEmails.findIndex(e => e.id === emailId);
        if (idx !== -1) {
          currentEmails[idx].status = 'failed';
          currentEmails[idx].error = err.message;
          writeSentEmails(currentEmails);
        }
      });
  } else {
    // B. Fallback to SMTP
    const from = process.env.SMTP_FROM || 'EduVistar <onboarding@resend.dev>';
    const client = getTransporter();

    client.sendMail({
      from,
      to,
      subject,
      text: body,
      html: htmlBody
    })
    .then(info => {
      console.log(`[SMTP] Email successfully sent to ${to} (Message ID: ${info.messageId})`);
      const currentEmails = readSentEmails();
      const idx = currentEmails.findIndex(e => e.id === emailId);
      if (idx !== -1) {
        currentEmails[idx].status = 'sent';
        currentEmails[idx].provider = 'smtp';
        currentEmails[idx].messageId = info.messageId;
        writeSentEmails(currentEmails);
      }
    })
    .catch(err => {
      console.error(`[SMTP] Failed to send email to ${to}:`, err);
      const currentEmails = readSentEmails();
      const idx = currentEmails.findIndex(e => e.id === emailId);
      if (idx !== -1) {
        currentEmails[idx].status = 'failed';
        currentEmails[idx].error = err.message;
        writeSentEmails(currentEmails);
      }
    });
  }

  return emailRecord;
}
