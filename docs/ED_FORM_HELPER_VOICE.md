# Ed Form Helper - Voice Integration

## Voice: Speech-to-Text and Text-to-Speech

Ed's existing voice capabilities integrate directly.

---

## Speech-to-Text (Listening)

Use browser's built-in Web Speech API (free, no API keys):

```typescript
class VoiceListener {
  private recognition: any;
  private isListening: boolean = false;

  constructor(language: string = 'en-GB') {
    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = language;
  }

  listen(timeoutMs: number = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results to user
        this.showInterim(interimTranscript, finalTranscript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        resolve(finalTranscript.trim());
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (event.error === 'no-speech') {
          resolve(''); // User didn't speak
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      // Timeout
      setTimeout(() => {
        if (this.isListening) {
          this.recognition.stop();
        }
      }, timeoutMs);

      this.isListening = true;
      this.recognition.start();
    });
  }

  private showInterim(interim: string, final: string) {
    // Update UI with what Ed is hearing
    const indicator = document.getElementById('ed-listening-indicator');
    if (indicator) {
      indicator.innerHTML = `
        <div class="ed-pulse"></div>
        <span>Listening...</span>
        <div class="ed-transcript">
          <strong>${final}</strong><em>${interim}</em>
        </div>
      `;
    }
  }

  stop() {
    if (this.isListening) {
      this.recognition.stop();
    }
  }
}
```

---

## Text-to-Speech (Speaking)

```typescript
class VoiceSpeaker {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    if (this.voices.length === 0) {
      // Voices load asynchronously
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
      };
    }
  }

  speak(text: string, language: string = 'en-GB'): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Select appropriate voice
      const voice = this.selectVoice(language);
      if (voice) utterance.voice = voice;

      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();

      this.synthesis.speak(utterance);
    });
  }

  private selectVoice(language: string): SpeechSynthesisVoice | null {
    // Map our language codes to browser voice codes
    const langMap: Record<string, string> = {
      'en': 'en-GB',
      'ur': 'ur-PK',
      'pl': 'pl-PL',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
    };

    const targetLang = langMap[language] || language;

    // Try to find exact match
    let voice = this.voices.find(v => v.lang === targetLang);
    if (voice) return voice;

    // Try to find partial match
    voice = this.voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    if (voice) return voice;

    // Default to first available
    return this.voices[0] || null;
  }

  stop() {
    this.synthesis.cancel();
  }
}
```

---

## Integration: Conversational Flow

```typescript
class ConversationalFormFiller {
  private listener: VoiceListener;
  private speaker: VoiceSpeaker;

  constructor(userLanguage: string = 'en') {
    this.listener = new VoiceListener(userLanguage);
    this.speaker = new VoiceSpeaker();
  }

  async fillFormConversationally(fields: FormField[]): Promise<void> {
    for (const field of fields) {
      // 1. Ed asks the question (speaks)
      const question = this.generateQuestion(field);
      await this.speaker.speak(question);

      // 2. Ed listens for answer
      const answer = await this.listener.listen(30000);

      // 3. Ed confirms what he heard
      const confirmation = `I heard: "${answer}". Is that correct?`;
      await this.speaker.speak(confirmation);

      // 4. Ed listens for yes/no
      const yesNo = await this.listener.listen(10000);

      if (this.isAffirmative(yesNo)) {
        // 5. Fill the field
        await this.fillField(field, answer);
        await this.speaker.speak("Got it.");
      } else {
        // 6. Ask again
        await this.speaker.speak("Let's try again. " + question);
        // (loop back)
      }
    }

    await this.speaker.speak("All done! Please check the form and click Submit.");
  }

  private generateQuestion(field: FormField): string {
    const questions = {
      'your-name': "What is your name?",
      'contact-number': "What's your phone number?",
      'email-address': "What's your email address?",
      'concern-details': "Please tell me about your concern. Take your time.",
    };

    return questions[field.name] || `What would you like to enter for ${field.label}?`;
  }

  private isAffirmative(response: string): boolean {
    const yesWords = ['yes', 'yeah', 'yep', 'correct', 'right', 'that\'s it', 'perfect'];
    const lower = response.toLowerCase().trim();
    return yesWords.some(w => lower.includes(w)) || lower === '';
  }
}
```

---

## Voice UI Indicator

```html
<div id="ed-voice-indicator" class="ed-voice-indicator">
  <div class="ed-wave"></div>
  <div class="ed-wave"></div>
  <div class="ed-wave"></div>
  <span class="ed-status">Listening...</span>
  <span class="ed-transcript">"What is your name?"</span>
</div>

<style>
.ed-voice-indicator {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 20px;
  color: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.ed-wave {
  width: 4px;
  height: 20px;
  background: white;
  border-radius: 2px;
  animation: ed-wave 1s ease-in-out infinite;
}

.ed-wave:nth-child(2) { animation-delay: 0.1s; }
.ed-wave:nth-child(3) { animation-delay: 0.2s; }

@keyframes ed-wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(2); }
}

.ed-status {
  font-size: 16px;
  font-weight: 500;
}

.ed-transcript {
  font-size: 14px;
  opacity: 0.9;
  font-style: italic;
}
</style>
```

---

## Language Support

```typescript
// Browser speech recognition languages
const SUPPORTED_SPEECH_LANGUAGES = {
  'en': 'en-GB',     // English (UK)
  'ur': 'ur-PK',     // Urdu (Pakistan)
  'pl': 'pl-PL',     // Polish
  'bn': 'bn-IN',     // Bengali (India)
  'gu': 'gu-IN',     // Gujarati
  'pa': 'pa-IN',     // Punjabi
  'ar': 'ar-SA',     // Arabic
  'zh': 'zh-CN',     // Chinese
  'hi': 'hi-IN',     // Hindi
  'es': 'es-ES',     // Spanish
  'fr': 'fr-FR',     // French
};

// Fallback for unsupported languages
function getBestSupportedLang(userLang: string): string {
  return SUPPORTED_SPEECH_LANGUAGES[userLang] || 'en-GB';
}
```

---

## Complete Example Flow

```
1. User clicks "Start Form Helper"
                ↓
2. Ed: [Speaks] "I'll help you fill this form. What's your name?"
                ↓
3. UI: Shows listening indicator with animated waves
                ↓
4. User: [Speaks] "My name is Ahmed Ali"
                ↓
5. UI: Shows interim text "My name is..." → "My name is Ahmed Ali"
                ↓
6. Ed: [Speaks] "I heard: Ahmed Ali. Is that correct?"
                ↓
7. User: [Speaks] "Yes"
                ↓
8. Ed: Types "Ahmed Ali" into the field
                ↓
9. Ed: [Speaks] "Great! What's your phone number?"
                ↓
... continues for all fields
```

---

## Quality: Improving Recognition

```typescript
// Tips for better voice recognition:

// 1. Provide context to user
function showListeningTip(field: FormField) {
  return `
    For best results, speak clearly and say:
    "${getExamplePhrase(field)}"
  `;
}

// 2. Use predictable formats
const EXAMPLE_PHRASES = {
  'email': "my email is ahmed at example dot com",
  'phone': "zero seven seven hundred, nine hundred, one two three",
  'name': "My name is Ahmed Ali",
  'date': "the nineteenth of February, twenty twenty-five",
};

// 3. Post-process with AI to clean up
async function cleanupTranscript(transcript: string, fieldType: string): Promise<string> {
  if (fieldType === 'email') {
    // Extract email from transcript
    const match = transcript.match(/[\w.-]+@[\w.-]+/);
    return match ? match[0] : transcript;
  }

  if (fieldType === 'tel') {
    // Clean phone number
    return transcript.replace(/[^\d\s+]/g, '');
  }

  return transcript;
}
```

---

## Testing Voice Quality

```typescript
// Test microphone permissions
async function checkMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

// Show helpful message if not allowed
if (!await checkMicrophoneAccess()) {
  showBanner(`
    🎤 Microphone access is needed for voice input.

    Please click the microphone icon in your browser
    and select "Allow".
  `);
}
```

---

## Summary

| Component | Technology | Status |
|-----------|------------|--------|
| Speech-to-Text | Web Speech API | ✅ Built-in, free |
| Text-to-Speech | Web Speech API | ✅ Built-in, free |
| Multilingual | Browser voices | ⚠️ Depends on OS |
| Fallback | Typing | ✅ Always available |

The voice integration uses browser-native APIs - no additional cost, works offline, and respects user privacy!
