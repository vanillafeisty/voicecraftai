# 🎙️ VoiceCraft AI - Context-Aware Speech & Text-to-Audio Studio

High-fidelity neural voice synthesis, real-time waveform visualization, conversational speech agent, and one-click shareable MP3 download URLs.

---

## 🌟 Key Capabilities

- **Instant URL Sharing & Direct MP3 Downloads**: Share direct links with any custom text query parameters (`?text=...&voice=Priya&autogenerate=true`), allowing anyone with the link to immediately listen and download their customized MP3 file.
- **Direct GET MP3 Download Endpoint**: `/api/tts/download-text?text=Hello&voice=Priya` triggers an immediate binary MP3 download in any browser, script, or cURL request.
- **6 Diverse Voice Profiles**: Priya, Aarav, Deepa, Rohan, Kore, and Fenrir.
- **Context Tone Presets**: Conversational, Studio Narrator, Storytelling, Instructional Tutorial, Formal Announcement, and Smart Assistant.
- **Long-Form Voice Workshop**: Multi-paragraph script editor with word count, time estimations, and template presets.

---

## 🚀 Deployment to GitHub & Vercel

### Step 1: Export to GitHub

1. In Google AI Studio Build, click on the **Settings ⚙️ / Export** menu in the top-right corner.
2. Select **Export to GitHub** or **Download ZIP**.
3. If using git CLI:
   ```bash
   git clone https://github.com/vanillafeisty/voicecraft-ai.git
   cd voicecraft-ai
   npm install
   npm run dev
   ```

---

### Step 2: Deploy to Vercel (One-Click)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select your **voicecraft-ai** repository.
3. Framework Preset: **Vite**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Vercel will automatically configure both the static Vite frontend and the serverless audio API routes (`/api/tts/generate` & `/api/tts/download-text`) via `vercel.json`!

#### (Optional) Environment Variables
- `GEMINI_API_KEY`: Add your Google Gemini API key in Vercel project settings to enable experimental Gemini speech generation.

---

## 🔗 Shareable Link Format

You can generate share links with custom text and voice parameters:

- **Interactive App Link**:
  ```
  https://your-domain.com/?text=Hello+World&voice=Priya&preset=conversational&autogenerate=true
  ```
- **Direct Instant MP3 Download URL**:
  ```
  https://your-domain.com/api/tts/download-text?text=Hello+World&voice=Priya
  ```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local fullstack development server on port 3000
npm run dev
```
