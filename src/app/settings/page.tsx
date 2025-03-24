/* eslint-disable react-hooks/exhaustive-deps */
// Settings.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { affirmationSettingsService, AffirmationSettingsType, defaultSettings } from "@/services/AffirmationSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Check, Upload, Download, Play, Pause } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceService } from "@/services/VoiceService";

export default function Settings() {
    const router = useRouter();
    const [settings, setSettings] = useState<AffirmationSettingsType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [previewVoiceService, setPreviewVoiceService] = useState<VoiceService | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
    const [voiceSpeed, setVoiceSpeed] = useState<number | undefined>(settings?.voice_speed);
    const [localVoiceName, setLocalVoiceName] = useState<string>("");

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        loadVoices();
    }, [settings]);

    const loadVoices = (): void => {
        if (typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined") {
            const allVoices = window.speechSynthesis.getVoices();
            setVoices(allVoices);
        }
        if (localVoiceName) {
            updateVoiceService(localVoiceName);
        }
    };

    const updateVoiceService = (voice = settings?.voice_name): void => {
        const voiceName = voices.find((v) => v.name === voice);
        setPreviewVoiceService(new VoiceService({
            text: 'i will be speaking your affirmations',
            rate: settings?.voice_speed,
            voice: voiceName,
        }));
    };

    useEffect(() => {
        if (localVoiceName) updateVoiceService(localVoiceName);
    }, [localVoiceName]);

    const loadSettings = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const userSettings = await affirmationSettingsService.list();
            if (userSettings.length > 0) {
                setSettings(userSettings[0]);
                if (userSettings[0].voice_name) setLocalVoiceName(userSettings[0].voice_name);
                if (userSettings[0].voice_speed) setVoiceSpeed(userSettings[0].voice_speed);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
        setIsLoading(false);
    };

    const handleVoiceChange = (voiceName: string): void => {
        setLocalVoiceName(voiceName);
    };

    const getFormValues = (e: React.FormEvent) => {
        const formData = new FormData(e.target as HTMLFormElement);
        const formEntries = Object.fromEntries(formData.entries());
        console.log(formEntries.voice_speed);

        return {
            voice_name: String(formEntries.voice_name),
            voice_speed: Number(formEntries.voice_speed),
            daily_goal: Number(formEntries.daily_goal),
            streak_goal: Number(formEntries.streak_goal),
            affirmation_text: String(formEntries.affirmation_text),
        };
    }

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsSaving(true);
        const updatedValues = getFormValues(e)
        console.log(updatedValues);


        try {
            const updatedSettings = {
                ...settings,
                ...updatedValues,    // Update the fields with the new values
            };
            if (settings && settings.id) {
                console.log('update settings', updatedSettings);

                await affirmationSettingsService.update(settings.id, updatedSettings);
            } else {
                const newSetting: AffirmationSettingsType = {
                    ...defaultSettings,
                    ...updatedValues,
                }
                await affirmationSettingsService.create(newSetting);
            }
            router.push('/');
        } catch (error) {
            console.error("Error saving settings:", error);
        }
        setIsSaving(false);
    };

    const handlePreview = (): void => {
        if (previewVoiceService) {
            if (isPreviewPlaying) {
                previewVoiceService.cancel();
            } else {
                previewVoiceService.speak();
            }
            setIsPreviewPlaying(!isPreviewPlaying);
        }
    };


    const handleExport = async (e: React.FormEvent): Promise<void> => {
        const newValues = getFormValues(e);
        let updatedSettings: AffirmationSettingsType;
        if (settings) {
            updatedSettings = {
                ...settings,
                ...newValues,
            };
            await affirmationSettingsService.update(settings.id, updatedSettings);
        } else {
            updatedSettings = {
                ...defaultSettings,
                ...newValues,
            }
            await affirmationSettingsService.create(updatedSettings);
        }
        const settingsJson = await affirmationSettingsService.exportSettings();
        if (settingsJson) {
            const blob = new Blob([settingsJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "affirmation_settings.json";
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleImport = async (): Promise<void> => {
        if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
            const file = fileInputRef.current.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    const importedSettings = await affirmationSettingsService.importSettings(e.target.result);
                    if (importedSettings) {
                        setSettings(importedSettings);
                    }
                }
            };
            reader.readAsText(file);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (!settings) return <div>No settings found</div>;

    return (
        <>
            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="voice">Voice</Label>
                        <div className="flex items-center gap-2">
                            <Select name='voice_name' onValueChange={handleVoiceChange} value={localVoiceName}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {voices.map((voice) => (
                                        <SelectItem key={voice.name} value={voice.name}>
                                            {voice.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" onClick={handlePreview}>
                                {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="affirmation">Your Affirmation</Label>
                        <Textarea
                            id="affirmation"
                            defaultValue={settings.affirmation_text}
                            name='affirmation_text'
                            placeholder="Enter your affirmation..."
                            className="h-32"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="speed">Voice Speed ({voiceSpeed}x)</Label>
                        <Slider
                            id="speed"
                            min={0.5}
                            max={2}
                            step={0.1}
                            defaultValue={[settings.voice_speed]}
                            onValueChange={(value) => setVoiceSpeed(value[0])}
                            name='voice_speed'
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="daily_goal">Daily Goal</Label>
                            <Input
                                id="daily_goal"
                                type="number"
                                min="1"
                                defaultValue={settings.daily_goal.toString()}
                                name='daily_goal'
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="streak_goal">Streak Goal (days)</Label>
                            <Input
                                id="streak_goal"
                                type="number"
                                min="1"
                                defaultValue={settings.streak_goal.toString()}
                                name='streak_goal'
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            <Check className="w-4 h-4 mr-2" />
                            Save Settings
                        </Button>
                    </div>
                    <div className="flex justify-between">
                        <Button type="button" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Export Settings
                        </Button>
                        <div>
                            <input
                                type="file"
                                accept="application/json"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={handleImport}
                            />
                            <Button type="button" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Settings
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>
        </>
    );
}

