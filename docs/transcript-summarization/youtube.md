# YouTube Transcript Summarization Feature

This feature allows users to input a YouTube video URL, fetch the transcript, and generate a concise summary using the Groq LLM API—all within the Next.js app.  
No Python backend is required; everything runs on Node.js for easy deployment.

---

## 📁 File Structure

```
src/
  app/
    api/
      get-transcript/
        route.ts           # Fetches YouTube transcript using Node.js
      summarize-transcript/
        route.ts           # Summarizes transcript using Groq API
    dashboard/
      youtube-transcript/
        page.tsx           # UI for input, transcript display, and summary
```

---

## 🚀 How It Works

1. **User enters a YouTube URL** on the dashboard page.
2. **Transcript is fetched** via `/api/get-transcript` using the [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) npm package.
3. **Summary is generated** via `/api/summarize-transcript`, which calls the Groq LLM API.
4. **Results are displayed**: transcript and summary.

---

## 🛠️ Setup Instructions

1. **Install dependencies:**
   ```sh
   npm install youtube-transcript
   ```

2. **Set up your environment variables:**
   - Add your Groq API key to `.env.local`:
     ```
     GROQ_API_KEY=your_groq_api_key_here
     ```

3. **API Endpoints:**
   - `POST /api/get-transcript`  
     **Body:** `{ "video_url": "https://www.youtube.com/watch?v=..." }`  
     **Response:** `{ "transcript": "..." }`
   - `POST /api/summarize-transcript`  
     **Body:** `{ "transcript": "..." }`  
     **Response:** `{ "summary": "..." }`

4. **Frontend Usage:**
   - The page at `/dashboard/youtube-transcript` provides the UI for input, transcript, and summary.

---

## 📝 Key Files Explained

- **`route.ts` (get-transcript):**  
  Extracts the video ID from the URL and fetches the transcript using the Node.js library.

- **`route.ts` (summarize-transcript):**  
  Sends the transcript to the Groq API and returns the summary.

- **`page.tsx`:**  
  Handles user input, displays the transcript, and shows the summary. Calls the above API routes.

---

## 💡 Notes

- No Python dependencies—everything is handled in Node.js for smooth deployment.
- Make sure your Groq API key is valid and set in the environment.
- For large transcripts, summarization may take a few seconds.

---

## 🧑‍💻 For Contributors

- Follow the existing API and UI patterns for consistency.
- If you want to extend this feature (e.g., add action item extraction), see the `meeting-summarizer` feature for inspiration.
- For shared logic, consider placing utilities in `src/features/`.

---

## 📚 References

- [youtube-transcript npm package](https://www.npmjs.com/package/youtube-transcript)
- [Groq API documentation](https://console.groq.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/api-routes)

---