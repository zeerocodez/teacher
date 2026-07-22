const fs = require('fs');
const path = require('path');

const directory = 'src/components';
const files = fs.readdirSync(directory).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(directory, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Custom replacements based on the alert message
  content = content.replace(/alert\("Please enter a valid verification code\."\);/g, 'toast.error("Please enter a valid verification code.");');
  content = content.replace(/alert\(`Simulated Chat with \$\{teacher\.name\}\. Interface is active in parent\/teacher dashboards\.`\);/g, 'toast.success(`Simulated Chat with ${teacher.name}. Interface is active in parent/teacher dashboards.`);');
  content = content.replace(/alert\("Please enter a valid deposit amount\."\);/g, 'toast.error("Please enter a valid deposit amount.");');
  content = content.replace(/alert\('Event added to Google Calendar!'\)/g, "toast.success('Event added to Google Calendar!')");
  content = content.replace(/alert\('Evidence Log PDF downloaded successfully\. File hash: sha256-4b2a8d\.\.\.'\)/g, "toast.success('Evidence Log PDF downloaded successfully. File hash: sha256-4b2a8d...')");
  content = content.replace(/alert\('Starting Zoom session\.\.\. Redirecting to virtual classroom\.\.\.'\)/g, "toast.success('Starting Zoom session... Redirecting to virtual classroom...')");
  content = content.replace(/alert\(`Booking request successfully \$\{action === 'Confirm' \? 'approved and scheduled' : 'rejected'\}\.`\);/g, "toast.success(`Booking request successfully ${action === 'Confirm' ? 'approved and scheduled' : 'rejected'}.`);");
  content = content.replace(/alert\('Booking successfully confirmed \(Local Sandbox Fallback\)\.'\);/g, "toast.success('Booking successfully confirmed (Local Sandbox Fallback).');");
  content = content.replace(/alert\('Booking successfully rejected \(Local Sandbox Fallback\)\.'\);/g, "toast.success('Booking successfully rejected (Local Sandbox Fallback).');");
  content = content.replace(/alert\("✓ Session marked as complete! 24-hour escrow auto-release countdown started\."\);/g, 'toast.success("✓ Session marked as complete! 24-hour escrow auto-release countdown started.");');
  content = content.replace(/alert\(data\.error \|\| "Failed to complete session\."\);/g, 'toast.error(data.error || "Failed to complete session.");');
  content = content.replace(/alert\("Session marked complete \(Sandbox Mode\)\."\);/g, 'toast.success("Session marked complete (Sandbox Mode).");');
  content = content.replace(/alert\("Please enter a valid class link\."\);/g, 'toast.error("Please enter a valid class link.");');
  content = content.replace(/alert\("Class link saved successfully!"\);/g, 'toast.success("Class link saved successfully!");');
  content = content.replace(/alert\(errorData\.error \|\| "Failed to submit link\."\);/g, 'toast.error(errorData.error || "Failed to submit link.");');
  content = content.replace(/alert\("Error submitting class link\."\);/g, 'toast.error("Error submitting class link.");');
  content = content.replace(/alert\('Simulated: Audio feedback recorded\. File feedback_audio_dsp\.mp3 attached\.'\)/g, "toast.success('Simulated: Audio feedback recorded. File feedback_audio_dsp.mp3 attached.')");
  content = content.replace(/alert\('Draft Report successfully published and sent to parent dashboard!'\)/g, "toast.success('Draft Report successfully published and sent to parent dashboard!')");
  content = content.replace(/alert\('Referral link copied to clipboard!'\)/g, "toast.success('Referral link copied to clipboard!')");
  content = content.replace(/alert\('Private student progress notes updated successfully!'\)/g, "toast.success('Private student progress notes updated successfully!')");
  content = content.replace(/alert\('Clock Log evidence PDF exported and downloaded successfully!'\)/g, "toast.success('Clock Log evidence PDF exported and downloaded successfully!')");
  content = content.replace(/alert\("Cloudinary upload preset is not configured\. Pasting a direct URL is supported as a fallback\."\);/g, 'toast.error("Cloudinary upload preset is not configured. Pasting a direct URL is supported as a fallback.");');
  content = content.replace(/alert\("Cloudinary upload failed: " \+ errMsg \+ "\. Using local temporary URL so you can proceed\."\);/g, 'toast.error("Cloudinary upload failed: " + errMsg + ". Using local temporary URL so you can proceed.");');
  content = content.replace(/alert\("Network error occurred during upload\."\);/g, 'toast.error("Network error occurred during upload.");');
  content = content.replace(/alert\("Error occurred during upload\."\);/g, 'toast.error("Error occurred during upload.");');
  content = content.replace(/alert\("Dispute lodged\. A support specialist is joining within 5 minutes\. Escrow funds locked\."\)/g, 'toast.error("Dispute lodged. A support specialist is joining within 5 minutes. Escrow funds locked.")');
  content = content.replace(/alert\(`✓ Upload Simulation: File "\$\{file\.name\}" uploaded successfully!`\);/g, 'toast.success(`✓ Upload Simulation: File "${file.name}" uploaded successfully!`);');
  content = content.replace(/alert\("Cloudinary upload failed: " \+ errMsg\);/g, 'toast.error("Cloudinary upload failed: " + errMsg);');
  content = content.replace(/alert\('Please enter a valid Google email address\.'\);/g, "toast.error('Please enter a valid Google email address.');");
  content = content.replace(/alert\(`Welcome email successfully queued for \$\{targetUser\.displayName\} \(\$\{targetUser\.email\}\)`\);/g, 'toast.success(`Welcome email successfully queued for ${targetUser.displayName} (${targetUser.email})`);');
  content = content.replace(/alert\(`Failed to send email: \$\{data\.error\}`\);/g, 'toast.error(`Failed to send email: ${data.error}`);');
  content = content.replace(/alert\("Network connection error sending welcome email\."\);/g, 'toast.error("Network connection error sending welcome email.");');
  content = content.replace(/alert\("Title and message are required\."\);/g, 'toast.error("Title and message are required.");');
  content = content.replace(/alert\("Notification & email update broadcast successfully completed\."\);/g, 'toast.success("Notification & email update broadcast successfully completed.");');
  content = content.replace(/alert\(`Failed to send notification: \$\{data\.error\}`\);/g, 'toast.error(`Failed to send notification: ${data.error}`);');
  content = content.replace(/alert\("Network connection error broadcasting notification\."\);/g, 'toast.error("Network connection error broadcasting notification.");');
  content = content.replace(/alert\(`✓ \$\{data\.message\}`\);/g, 'toast.success(`✓ ${data.message}`);');
  content = content.replace(/alert\(`Error: \$\{data\.error\}`\);/g, 'toast.error(`Error: ${data.error}`);');
  content = content.replace(/alert\("Dispute resolved \(Sandbox Mode\)\."\);/g, 'toast.success("Dispute resolved (Sandbox Mode).");');
  content = content.replace(/alert\("Please fill all required onboarding fields\."\);/g, 'toast.error("Please fill all required onboarding fields.");');

  if (content !== originalContent) {
    if (!content.includes("import toast")) {
      content = content.replace(/import React(.*?)from 'react';/, "import React$1from 'react';\nimport toast from 'react-hot-toast';");
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
console.log("Done");
