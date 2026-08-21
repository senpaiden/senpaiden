const { google } = require('googleapis');
const fs = require('fs');
const http = require('http');
const url = require('url');
require('dotenv').config();

const clientSecretFile = 'client_secret_637816667624-dab8mrsfofcesk1l3f5688iemvocuf2o.apps.googleusercontent.com.json';
const credentials = JSON.parse(fs.readFileSync(clientSecretFile, 'utf8')).installed || JSON.parse(fs.readFileSync(clientSecretFile, 'utf8')).web;

const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  'http://localhost:8989/oauth2callback'
);

const scopes = [
  'https://www.googleapis.com/auth/drive',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Forces generation of a refresh token
});

console.log('====================================================');
console.log('🔗 GOOGLE DRIVE USER OAUTH AUTHORIZATION');
console.log('====================================================\n');
console.log('👉 Please open this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for your authorization on local port 8989...');

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/oauth2callback')) {
    const qs = new url.URL(req.url, 'http://localhost:8989').searchParams;
    const code = qs.get('code');

    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>✅ Authorization Successful!</h1><p>You can close this tab and return to the terminal.</p>');

      try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\n✅ REFRESH TOKEN RECEIVED SUCCESSFULLY!');

        let env = fs.readFileSync('.env', 'utf8');
        env = env.replace(/GDRIVE_OAUTH_CLIENT_ID=.*/g, '');
        env = env.replace(/GDRIVE_OAUTH_CLIENT_SECRET=.*/g, '');
        env = env.replace(/GDRIVE_REFRESH_TOKEN=.*/g, '');
        env += `\nGDRIVE_OAUTH_CLIENT_ID=${credentials.client_id}\nGDRIVE_OAUTH_CLIENT_SECRET=${credentials.client_secret}\nGDRIVE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        fs.writeFileSync('.env', env);

        console.log('✅ Updated .env with permanent GDRIVE_REFRESH_TOKEN!');
        console.log('====================================================');
      } catch (err) {
        console.error('❌ Failed to exchange code for tokens:', err.message);
      } finally {
        server.close();
        process.exit(0);
      }
    }
  }
}).listen(8989);
