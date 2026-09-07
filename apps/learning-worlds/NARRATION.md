# Schoolgle Worlds narration

The three worlds use original synthetic guide voices created for Schoolgle using Fish Audio Voice Design on 7 September 2026. They are fictional narrators, not impersonations or recordings of historical people. The source voice models are private in the owner's Fish account. Source scripts remain visible on screen; no child responses or account details are sent to a voice service during play.

## Content and playback

- Nile: 19 recordings for existing introductions, hints, control explanations, scribe message and stone instructions.
- Gunpowder Plot: 32 recordings for introductions, wardrobe explanations, investigation phases, rewards, rhyme and return recall.
- Great Fire: 44 recordings for stories, investigation phases and finite model variants, final and return recall.
- Files are generated with Fish `s2-pro`, 128 kbps MP3, normalised loudness and a measured pace. Only requested clips load; the entire bank is not downloaded at startup.
- Read aloud controls use exact normalised script matching. Playback pauses/resumes and stops when moving between activities, closing a dialog, hiding the page or starting another recording. The original text remains available.
- If a recording fails or a new script has no recording, an explicitly labelled device voice provides a fallback. No Fish credential is bundled with the games.
- Nile demonstration captions and return questions without an existing Read aloud trigger remain text-only. Fire's personal model summary values remain visible; narration reads its fixed explanation and historical context.

## Maintaining the bank

Edit `src/narration/{game}.json` alongside the actual displayed/read text. Run `node scripts/generate-narration.mjs nile plot fire` with server-only `FISH_AUDIO_API_KEY` and private `FISH_WORLDS_VOICE_NILE`, `FISH_WORLDS_VOICE_PLOT`, `FISH_WORLDS_VOICE_FIRE` supplied to the generation process. Do not place credentials in a public/Vite environment variable. This command makes paid API requests only for absent or changed scripts and stops on API failure. It preserves existing reviewed clips. Remove a specific manifest entry first when deliberately regenerating an unchanged script; review the result before replacing the public file.

The `*-audio.json` manifests bind exact displayed scripts to reviewed versioned files. Pronunciation aliases affect generated audio only; historical spellings remain on screen. Pepys is spoken as “Peeps”, and Monteagle as “Mount Eagle”. Review names, dates, numbers and the complete ending after regeneration. Do not treat an automatic transcript as a full human listening assessment.

## Verification

The release baseline completed all main tasks in all three public games with fictional pupils, including deliberate wrong answers, correction, recall, evidence exports and persistence. The voice upgrade additionally checks the player against stale promises, repeated clicks, deliberate pause, missing media, modal closure and autoplay denial. The complete recording bank is checked by browser decoding/playback and automatic transcription; sample Read aloud controls are tested in each game. Physical school tablets, assistive technology and children's understanding/engagement still need supervised review.

Original voice-design samples and account metadata remain in ignored local test-results. Only the reviewed MP3s, scripts and player are shipped. The older unlicensed desktop WAVs remain excluded from hosted builds.

Official API references: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech and https://fish.audio/blog/voice-design/.
