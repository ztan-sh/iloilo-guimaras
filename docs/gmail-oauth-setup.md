# Gmail OAuth setup for password reset email

The API can send password-reset emails through the Gmail API after an administrator connects the `GMAIL_SENDER_EMAIL` mailbox. OAuth credentials and the encrypted refresh token stay on the server; they do not go into Vercel client settings or the Android APK.

## Google Cloud settings

1. In the Google Cloud project, enable **Gmail API**.
2. Configure the OAuth consent screen as **External**. Add `guimarasgo2026@gmail.com` as a test user while configuring it.
3. Create an OAuth client of type **Web application**.
4. Add this exact Authorized redirect URI:

   `https://iloilo-guimaras.onrender.com/api/admin/email/gmail/callback`

5. Save the OAuth client ID and client secret. Do not put the client secret in the frontend, GitHub, or APK.

The server requests `openid`, `email`, and `https://www.googleapis.com/auth/gmail.send`; the callback checks that the authorized Gmail account matches `GMAIL_SENDER_EMAIL`.

## Render environment variables

Set these as private environment variables on the Render service that runs the API:

```env
GMAIL_OAUTH_CLIENT_ID=your-client-id-from-google
GMAIL_OAUTH_CLIENT_SECRET=your-client-secret-from-google
GMAIL_OAUTH_REDIRECT_URI=https://iloilo-guimaras.onrender.com/api/admin/email/gmail/callback
GMAIL_SENDER_EMAIL=guimarasgo2026@gmail.com
GMAIL_OAUTH_STATE_SECRET=generate-a-long-random-secret
GMAIL_TOKEN_ENCRYPTION_KEY=generate-a-base64-encoded-32-byte-key
CLIENT_URL=https://iloilo-guimaras.vercel.app
```

Generate the two server secrets locally in PowerShell (the commands print random secrets; add their output directly to Render, not to the repository):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use the first output for `GMAIL_OAUTH_STATE_SECRET` and the second output for `GMAIL_TOKEN_ENCRYPTION_KEY`. Keep the encryption key permanently; losing it means the server cannot decrypt its saved Gmail refresh token, and you will need to reconnect the mailbox.

## Connect the mailbox

After saving the Render settings and letting the API redeploy:

1. Open `https://iloilo-guimaras.vercel.app` in the same browser and sign in as an administrator.
2. Open the browser developer console on that app page. Run this request to get Google's authorization URL. The browser's HttpOnly admin cookie authenticates the request:

   ```js
   fetch("https://iloilo-guimaras.onrender.com/api/admin/email/gmail/connect", {
     method: "POST",
     headers: {
       "Content-Type": "application/json"
     },
     credentials: "include"
   }).then(r => r.json()).then(console.log)
   ```

3. Open the `authorizationUrl` returned by the request, sign in as `guimarasgo2026@gmail.com`, and approve the requested Gmail sending permission. Google returns to the API callback, which encrypts and saves the refresh token in MongoDB.
4. While still signed in as admin, check the connection status:

   ```js
   fetch("https://iloilo-guimaras.onrender.com/api/admin/email/gmail/status", {
     credentials: "include"
   }).then(r => r.json()).then(console.log)
   ```

   A successful setup reports `configured: true` and `connected: true`.

The reset link itself is built using `CLIENT_URL`, so it opens the hosted Vercel reset-password page on mobile. Gmail OAuth changes only the server-side mail delivery; it does not require putting OAuth credentials in the APK. Current Resend settings continue to work as a fallback when Gmail has not been connected.

Google OAuth apps in Testing can have short-lived refresh tokens for Gmail scopes. Before relying on this for all passengers, complete the required Google consent-screen production setup and verification for the requested scope. Do not ask users for their Google passwords, and do not email a default or existing password; this flow sends only the existing one-time, expiring reset link.
