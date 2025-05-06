# Meeting Transcript Summarizer Feature

This feature enables users to upload or paste meeting transcripts, generate a structured summary, and extract action items using the Groq LLM API—all within the Next.js app.

---

## 📁 File Structure

```
src/
  app/
    dashboard/
      meeting-summarizer/
        page.tsx                # Main UI for meeting summarizer
        layout.tsx              # Layout and styles for the feature
    api/
      process-transcript/
        route.ts                # API route for processing transcript (summary + action items)
  features/
    meeting-summarizer/
      components/
        TranscriptUploader.tsx  # Upload/paste transcript UI
        MeetingResults.tsx      # Displays summary and action items
        MeetingSummarizerStyles.tsx # Custom styles for the feature
      transcript-processor.ts   # Logic for calling Groq API and processing transcript
```

---

## 🚀 How It Works

1. **User uploads or pastes a meeting transcript** on the dashboard page.
2. **Transcript is sent** to `/api/process-transcript`.
3. **Backend processes transcript**:
   - Generates a summary using the Groq LLM API.
   - Extracts action items (task, assignee, deadline) using the Groq LLM API.
4. **Results are displayed**: summary and action items, with download options.

---

## 🛠️ Setup Instructions

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up your environment variables:**
   - Add your Groq API key to `.env.local`:
     ```
     GROQ_API_KEY=your_groq_api_key_here
     ```

3. **API Endpoint:**
   - `POST /api/process-transcript`  
     **Body:** `{ "transcript": "..." }`  
     **Response:**  
     ```json
     {
       "summary": "...",
       "action_items": [
         { "task": "...", "assignee": "...", "deadline": "..." }
       ]
     }
     ```

4. **Frontend Usage:**
   - The page at `/dashboard/meeting-summarizer` provides the UI for uploading/pasting transcripts and viewing results.

---

## 📝 Key Files Explained

- **`page.tsx`**:  
  Main UI for uploading/pasting transcripts, triggering processing, and displaying results.

- **`TranscriptUploader.tsx`**:  
  Lets users upload a file or paste transcript text.

- **`MeetingResults.tsx`**:  
  Displays the summary and action items, with download buttons.

- **`transcript-processor.ts`**:  
  Handles calling the Groq API for both summarization and action item extraction.

- **`route.ts` (process-transcript)**:  
  API route that receives the transcript, calls the processor, and returns results.

---

## 💡 Notes

- All LLM calls are handled in Node.js for easy deployment.
- Action items are extracted as structured JSON (task, assignee, deadline).
- For large transcripts, processing may take a few seconds.
- Download buttons allow users to save summaries and action items as `.txt` files.

---

## 🧑‍💻 For Contributors

- Follow the existing API and UI patterns for consistency.
- To extend:  
  - Add more fields to action items in `transcript-processor.ts` and update UI accordingly.
  - Add more result formats or export options as needed.
- For shared logic, place utilities in `src/features/`.

---

## 📚 References

- [Groq API documentation](https://console.groq.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/api-routes)

---