/**
 * VoiceInput - Web Speech API integration
 */

type SpeechRecognition = typeof window.SpeechRecognition;
type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

export class VoiceInput {
  private recognition: InstanceType<SpeechRecognition> | null = null;
  private isListening = false;
  private language: string;

  private onResultCallback: ((text: string) => void) | null = null;
  private onListeningChangeCallback: ((listening: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(language = 'en-GB') {
    this.language = language;
    this.initRecognition();
  }

  private initRecognition(): void {
    // Check for browser support
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: SpeechRecognition; webkitSpeechRecognition?: SpeechRecognition }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: SpeechRecognition; webkitSpeechRecognition?: SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('[Ed Voice] Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningChangeCallback?.(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningChangeCallback?.(false);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];

      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim();
        if (text) {
          this.onResultCallback?.(text);
        }
      }
    };

    this.recognition.onerror = (event: Event & { error: string }) => {
      console.error('[Ed Voice] Error:', event.error);
      this.isListening = false;
      this.onListeningChangeCallback?.(false);
      this.onErrorCallback?.(event.error);
    };
  }

  /**
   * Start listening for speech
   */
  public start(): void {
    if (!this.recognition) {
      this.onErrorCallback?.('Speech recognition not supported');
      return;
    }

    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('[Ed Voice] Failed to start:', error);
    }
  }

  /**
   * Stop listening
   */
  public stop(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('[Ed Voice] Failed to stop:', error);
    }
  }

  /**
   * Set the recognition language
   */
  public setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Register callback for speech results
   */
  public onResult(callback: (text: string) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Register callback for listening state changes
   */
  public onListeningChange(callback: (listening: boolean) => void): void {
    this.onListeningChangeCallback = callback;
  }

  /**
   * Register callback for errors
   */
  public onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Check if voice input is supported
   */
  public isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.stop();
    this.recognition = null;
  }
}

/**
 * Voice Output - Text to Speech
 */
export class VoiceOutput {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private pitch = 1;
  private rate = 1;
  private language = 'en-GB';

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load async
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    // Prefer UK English voice
    this.voice =
      voices.find((v) => v.lang === 'en-GB') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
  }

  /**
   * Speak text
   */
  public speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.pitch = this.pitch;
      utterance.rate = this.rate;
      utterance.lang = this.language;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  public stop(): void {
    this.synth?.cancel();
  }

  /**
   * Set voice parameters
   */
  public setVoice(language: string, pitch = 1, rate = 1): void {
    this.language = language;
    this.pitch = pitch;
    this.rate = rate;

    // Find matching voice
    const voices = this.synth.getVoices();
    this.voice =
      voices.find((v) => v.lang === language) ||
      voices.find((v) => v.lang.startsWith(language.split('-')[0])) ||
      this.voice;
  }

  /**
   * Check if voice is available for language
   */
  public hasVoice(language: string): boolean {
    const voices = this.synth.getVoices();
    return voices.some(
      (v) => v.lang === language || v.lang.startsWith(language.split('-')[0])
    );
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }
}

