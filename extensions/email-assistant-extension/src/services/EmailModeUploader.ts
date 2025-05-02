const API_URL = 'http://localhost:3000/api/email-mode/receive'; // Dev mode

const EMAIL_EXTENSION_SECRET = 'teamsAERA'; // Must match server secret

export async function uploadEmailSummariesToCopilotApp(emailSummaries: string[]) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EMAIL_EXTENSION_SECRET}`,
        },
        body: JSON.stringify({
          emailSummaries: emailSummaries, // Only sending summaries
        }),
      });
  
      const result = await response.json();
      console.log('Upload successful:', result.message);
  
    } catch (error) {
      console.error('Failed to upload email summaries:', error);
    }
  }
  