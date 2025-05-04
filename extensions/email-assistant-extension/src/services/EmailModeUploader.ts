const API_URL = 'http://localhost:3000/api/email-mode/receive'; // Dev mode
export async function uploadEmailSummariesToCopilotApp(emailSummaries: string[], projectName: string) {
  chrome.storage.local.get('supabaseSession', async ({ supabaseSession }) => {
    const accessToken = supabaseSession?.access_token;
    if (!accessToken) {
      console.error('❌ No access token found');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/email-mode/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // ✅ Correct token
        },
        body: JSON.stringify({
          projectName, // ✅ Now included at top-level
          emailData: emailSummaries, // ✅ Keep this
        }),
      });

      const result = await response.json();
      console.log('✅ Upload successful:', result);
    } catch (error) {
      console.error('❌ Failed to upload email summaries:', error);
    }
  });
}
