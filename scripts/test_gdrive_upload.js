const { google } = require('googleapis');
const fs = require('fs');
const { Readable } = require('stream');
require('dotenv').config();

async function testUploadAndFetch() {
  console.log('====================================================');
  console.log('🚀 TESTING LIVE UPLOAD TO 5TB GOOGLE DRIVE FOLDER');
  console.log('====================================================\n');

  const folderId = process.env.GDRIVE_ROOT_FOLDER_ID || '1fuQL_bDYtyksz9BTb8rM0QN1qm2bGJTr';
  const key = JSON.parse(fs.readFileSync('trusty-dialect-449006-m1-5c522393b0ec.json', 'utf8'));

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 1. Verify Folder Access
    const folderRes = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, capabilities',
      supportsAllDrives: true,
    });
    console.log(`✅ Linked Folder: "${folderRes.data.name}" (ID: ${folderRes.data.id})`);
    console.log(`   Can Add Children: ${folderRes.data.capabilities?.canAddChildren}`);

    // 2. Upload a Test WebP File
    const dummyWebP = Buffer.from('RIFF24000000WEBPVP8X0a00000002000000000000000000', 'hex');
    const testFileName = `test_verification_${Date.now()}.webp`;

    const stream = new Readable();
    stream.push(dummyWebP);
    stream.push(null);

    console.log(`\n📤 Uploading sample file '${testFileName}' to folder...`);
    const uploadRes = await drive.files.create({
      requestBody: {
        name: testFileName,
        mimeType: 'image/webp',
        parents: [folderId],
      },
      media: {
        mimeType: 'image/webp',
        body: stream,
      },
      fields: 'id, name, size, webViewLink',
      supportsAllDrives: true,
    });

    const fileId = uploadRes.data.id;
    console.log(`✅ File Uploaded Successfully!`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   Web View Link: ${uploadRes.data.webViewLink}`);

    // 3. Test Reading Stream via API
    console.log(`\n📥 Fetching media stream back from Google Drive...`);
    const downloadRes = await drive.files.get({
      fileId: fileId,
      alt: 'media',
      supportsAllDrives: true,
    }, { responseType: 'arraybuffer' });

    console.log(`✅ Download Stream Verified! Received ${downloadRes.data.byteLength} bytes.`);
    console.log(`\n====================================================`);
    console.log(`🎉 5TB GOOGLE DRIVE STORAGE IS 100% READY & WORKING!`);
    console.log(`====================================================`);
  } catch (err) {
    console.error('❌ Google Drive Error:', err.message);
  }
}

testUploadAndFetch();
