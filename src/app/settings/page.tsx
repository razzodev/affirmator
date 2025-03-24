// Settings.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { affirmationSettingsService, AffirmationSettingsType } from "@/entities/AffirmationSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Check, Upload, Download } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function Settings() {
    const router = useRouter();
    const [settings, setSettings] = useState<AffirmationSettingsType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const userSettings = await affirmationSettingsService.list();
            if (userSettings.length > 0) {
                setSettings(userSettings[0]);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!settings) return;

        setIsSaving(true);
        try {
            await affirmationSettingsService.update(settings.id, settings);
            router.push('/');
        } catch (error) {
            console.error("Error saving settings:", error);
        }
        setIsSaving(false);
    };

    const handleExport = async (): Promise<void> => {
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
                        <Label htmlFor="affirmation">Your Affirmation</Label>
                        <Textarea
                            id="affirmation"
                            value={settings.affirmation_text}
                            onChange={(e) =>
                                setSettings({ ...settings, affirmation_text: e.target.value })
                            }
                            placeholder="Enter your affirmation..."
                            className="h-32"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="speed">Voice Speed ({settings.voice_speed}x)</Label>
                        <Slider
                            id="speed"
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[settings.voice_speed]}
                            onValueChange={(value) =>
                                setSettings({ ...settings, voice_speed: value[0] })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="daily_goal">Daily Goal</Label>
                            <Input
                                id="daily_goal"
                                type="number"
                                min="1"
                                value={settings.daily_goal}
                                onChange={(e) =>
                                    setSettings({ ...settings, daily_goal: parseInt(e.target.value) })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="streak_goal">Streak Goal (days)</Label>
                            <Input
                                id="streak_goal"
                                type="number"
                                min="1"
                                value={settings.streak_goal}
                                onChange={(e) =>
                                    setSettings({ ...settings, streak_goal: parseInt(e.target.value) })
                                }
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