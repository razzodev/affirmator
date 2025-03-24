// Home.tsx
"use client";
import React, { useState, useEffect } from "react";
import { affirmationSettingsService, AffirmationSettingsType } from "@/entities/AffirmationSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Timer,
  Star,
} from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [settings, setSettings] = useState<AffirmationSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [words, setWords] = useState<string[]>([]);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  useEffect(() => {
    loadSettings().then();

  }, []);

  useEffect(() => {
    if (settings?.affirmation_text) {
      setWords(settings.affirmation_text.split(" "));
    }
  }, [settings?.affirmation_text]);

  const loadSettings = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const userSettings = await affirmationSettingsService.list();
      if (userSettings.length > 0) {
        setSettings(userSettings[0]);
        if (
          userSettings[0].last_practice_date &&
          format(new Date(userSettings[0].last_practice_date), "yyyy-MM-dd") !==
          format(new Date(), "yyyy-MM-dd")
        ) {
          if (
            format(new Date(userSettings[0].last_practice_date), "yyyy-MM-dd") ===
            format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd")
          ) {
            await affirmationSettingsService.update(userSettings[0].id, {
              daily_count: 0,
              last_practice_date: new Date().toISOString(),
              current_streak: userSettings[0].current_streak + 1,
            });
          } else {
            await affirmationSettingsService.update(userSettings[0].id, {
              daily_count: 0,
              last_practice_date: new Date().toISOString(),
              current_streak: 0,
            });
          }
          const updatedSettings = await affirmationSettingsService.list();
          if (updatedSettings.length > 0) setSettings(updatedSettings[0]);
        }
      } else {
        const newSettings = await affirmationSettingsService.create({
          affirmation_text: "I am capable of achieving great things",
          daily_goal: 10,
          streak_goal: 21,
          voice_speed: 1,
          last_practice_date: new Date().toISOString(),
          current_streak: 0,
          daily_count: 0,
        });
        if (newSettings !== undefined) setSettings(newSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && words.length > 0) {
      interval = setInterval(() => {
        setCurrentWordIndex((prevIndex) => {
          if (prevIndex >= words.length - 1) {
            if (isLooping) {
              incrementDailyCount();
              return 0;
            } else {
              setIsPlaying(false);
              incrementDailyCount();
              return prevIndex;
            }
          }
          return prevIndex + 1;
        });
      }, settings?.voice_speed ? settings.voice_speed * 300 : 300);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, words, isLooping, settings?.voice_speed]);

  const incrementDailyCount = async (): Promise<void> => {
    if (!settings) return;
    const updatedSettings = await affirmationSettingsService.update(settings.id, {
      daily_count: settings.daily_count + 1,
      last_practice_date: new Date().toISOString(),
    });
    if (updatedSettings) setSettings(updatedSettings);
  };

  const adjustDailyCount = async (increment: number): Promise<void> => {
    if (!settings) return;
    const updatedSettings = await affirmationSettingsService.update(settings.id, {
      daily_count: Math.max(0, settings.daily_count + increment),
    });
    if (updatedSettings) setSettings(updatedSettings);
  };

  const handlePlayPause = (): void => {
    if (!isPlaying) {
      setCurrentWordIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = (): void => {
    setIsPlaying(false);
    setCurrentWordIndex(0);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!settings) {
    return <div>No settings found</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-500" />
            <span className="text-lg font-medium">
              Today: {settings.daily_count} / {settings.daily_goal}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-medium">
              Streak: {settings.current_streak} / {settings.streak_goal} days
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-inner min-h-[120px] mb-6 text-center">
          {words.map((word, index) => (
            <span
              key={index}
              className={`inline-block mx-1 text-xl ${index === currentWordIndex && isPlaying
                ? "text-purple-600 font-bold scale-110 transition-all"
                : "text-gray-700"
                }`}
            >
              {word}
            </span>
          ))}
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <Button
            size="lg"
            variant={isPlaying ? "outline" : "default"}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button size="lg" variant="outline" onClick={handleStop}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant={isLooping ? "default" : "outline"}
            onClick={() => setIsLooping(!isLooping)}
          >
            🔄 Loop
          </Button>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => adjustDailyCount(-1)}
            disabled={settings?.daily_count <= 0}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-gray-100 rounded-md font-medium">
            {settings?.daily_count}
          </div>
          <Button variant="outline" onClick={() => adjustDailyCount(1)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
