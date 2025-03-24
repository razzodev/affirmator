// VoiceService.ts

interface VoiceServiceConfig {
    text?: string;
    rate?: number;
    voice?: SpeechSynthesisVoice | null;
}

export class VoiceService {
    utterance: SpeechSynthesisUtterance | null = null;

    constructor(config: VoiceServiceConfig) {
        this.updateConfig(config);
    }

    updateConfig(config: VoiceServiceConfig): void {
        if (!this.utterance && config.text) {
            this.utterance = new SpeechSynthesisUtterance(config.text);
        }
        if (this.utterance) {
            if (config.text !== undefined) {
                this.utterance.text = config.text;
            }
            if (config.rate !== undefined) {
                this.utterance.rate = config.rate;
            }
            if (config.voice !== undefined) {
                this.utterance.voice = config.voice;
            }
        }
    }

    speak(): void {
        if (this.utterance) {
            speechSynthesis.speak(this.utterance);
        }
    }

    cancel(): void {
        speechSynthesis.cancel();
    }

    setRate(rate: number): void {
        if (this.utterance) {
            this.utterance.rate = rate;
        }
    }
    setVoice(voice: SpeechSynthesisVoice | null): void {
        if (this.utterance) {
            this.utterance.voice = voice;
        }
    }
    setText(text: string): void {
        if (this.utterance) {
            this.utterance.text = text;
        }
    }
}