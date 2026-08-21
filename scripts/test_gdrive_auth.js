const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

async function testAuth() {
  console.log('====================================================');
  console.log('🔐 TESTING GOOGLE DRIVE SERVICE ACCOUNT AUTHENTICATION');
  console.log('====================================================\n');

  const keyPath = 'trusty-dialect-449006-m1-5c522393b0ec.json';
  if (!fs.existsSync(keyPath)) {
    console.error('Key file missing:', keyPath);
    return;
  }

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  console.log('Project ID:', key.project_id);
  console.log('Client Email:', key.client_email);

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType, size)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    console.log('\n✅ AUTHENTICATION SUCCESSFUL!');
    console.log('Files visible to Service Account:', res.data.files?.length || 0);
    if (res.data.files && res.data.files.length > 0) {
      for (const f of res.data.files) {
        console.log(`  • [${f.name}] (ID: ${f.id}, Type: ${f.mimeType})`);
      }
    } else {
      console.log('  (Folder is empty or no shared folders visible yet)');
    }
  } catch (err) {
    console.error('❌ Google Drive API Error:', err.message);
  }
  console.log('\n====================================================');
}

testAuth();
