// Home.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { affirmationSettingsService, AffirmationSettingsType, defaultSettings } from "@/services/AffirmationSettings";
import { VoiceService } from "@/services/VoiceService"; // Adjust the path as needed

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Speech, { HighlightedText } from "react-text-to-speech";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Timer,
  Star,
} from "lucide-react";
import { format, set } from "date-fns";

export default function Home() {
  const [settings, setSettings] = useState<AffirmationSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  // const [words, setWords] = useState<string[]>([]);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [voiceService, setVoiceService] = useState<VoiceService | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false); // Add this state
  // const endDelay = useRef(2000); // Add a ref for end delay (in milliseconds)

  const loadSettings = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const settings = await affirmationSettingsService.list();
      handleStreakUpdate(settings[0]);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  };


  useEffect(() => {
    loadSettings().then(() => {
      if (typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined") {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoicesLoaded(true);
        };
        setVoicesLoaded(window.speechSynthesis.getVoices().length > 0);

      }
      if (settings) {

        setVoiceService(new VoiceService({
          text: settings.affirmation_text,
          rate: settings.voice_speed,
          voice: window.speechSynthesis.getVoices().find((v) => v.name === settings.voice_name) || null,
        }));

      }
    });
  }, [])


  useEffect(() => {
    if (voicesLoaded && settings?.affirmation_text && settings?.voice_speed) {
      // setWords(settings.affirmation_text.split(" "));
      let voice: SpeechSynthesisVoice | null = null;
      if (settings.voice_name) {
        voice = window.speechSynthesis.getVoices().find((v) => v.name === settings.voice_name) || null;
      }

      setVoiceService(new VoiceService({
        text: settings.affirmation_text,
        rate: settings.voice_speed,
        voice: voice,
      }));
    }
  }, [settings?.affirmation_text, settings?.voice_speed, settings?.voice_name, voicesLoaded]);

  const handleStreakUpdate = async (settings: AffirmationSettingsType) => {
    const isPracticedToday = format(new Date(settings.last_practice_date), "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")
    const isPracticedYesterday = format(new Date(settings.last_practice_date), "yyyy-MM-dd") === format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd")
    if (!isPracticedToday) {
      if (isPracticedYesterday) {
        await affirmationSettingsService.update(settings.id, {
          daily_count: 0,
          current_streak: settings.current_streak + 1,
          last_practice_date: new Date().toISOString(),
        })
      } else {
        await affirmationSettingsService.update(settings.id, {
          daily_count: 0,
          last_practice_date: new Date().toISOString(),
          current_streak: 0,
        })
      }
      const updatedSettings = await affirmationSettingsService.list();
      if (updatedSettings.length > 0) setSettings(updatedSettings[0]);

    } else {
      const newSettings = await affirmationSettingsService.create(defaultSettings);
      if (newSettings !== undefined) setSettings(newSettings);
    }
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
      // setCurrentWordIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = (): void => {
    setIsPlaying(false);
    // setCurrentWordIndex(0);
    setIsLooping(false); // Reset loop when stopped
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
        <pre style={{ flex: "1", minHeight: "-webkit-fill-available" }}>
          {settings.affirmation_text}
        </pre>
        <HighlightedText style={{ height: "26px" }}>
          {settings.affirmation_text}
        </HighlightedText>
        <Speech
          text={settings.affirmation_text}
          pitch={1}
          rate={settings.voice_speed}
          volume={1}
          voiceURI={settings.voice_name}
          // highlightMode={true}
          highlightText={true}
          showOnlyHighlightedText={false}
        >

          {({ speechStatus, isInQueue, start, pause, stop }) => (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  columnGap: "0.5rem",
                }}
              >
                {isLooping && speechStatus === 'stopped' && (
                  <>
                    {start && (
                      start(),
                      adjustDailyCount(1)
                    )}
                  </>
                )}

                <div className="flex justify-center gap-3 mb-6">

                  <Button
                    size="lg"
                    variant={isPlaying ? "outline" : "default"}
                    onClick={() => {
                      handlePlayPause();
                      if (!isPlaying && start) {
                        start()
                        adjustDailyCount(1)
                      }
                      if (isPlaying && pause) {
                        pause()
                      };
                    }}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => {
                    handleStop()
                    if (stop) stop()
                  }}>
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
              </div>

            </>
          )}
        </Speech>

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
    </div >
  );
}

// import { useContext, useState } from "react";
// import Counter from "../components/Counter.jsx";
// import { AppContext } from "../Context";
// import Speech, { HighlightedText } from "react-text-to-speech";
// import UseVoices from "../components/UseVoices";
// export default function Home() {
//   const {
//     affirmationText,
//     repeatCounter,
//     setRepeatCounter,
//     dayStreak,
//     dayCounter,
//     setDayCounter,
//     voice,
//     speechSpeed,
//   } = AppContext();

//   const [isLoop, setIsLoop] = useState(false);
//   return (
//     <div>
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <Speech
//           text={affirmationText}
//           pitch={1}
//           rate={speechSpeed}
//           volume={1}
//           voiceURI={voice}
//           // highlightMode={true}
//           highlightText={true}
//           showOnlyHighlightedText={true}
//         >
//           {({ speechStatus, isInQueue, start, pause, stop }) => (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "center",
//                 columnGap: "0.5rem",
//               }}
//             >
//               {isLoop &&
//                 speechStatus === "stopped" &&
//                 (() => {
//                   start();
//                   setRepeatCounter((state) => Number(state) + 1);
//                 })()}
//               {speechStatus !== "started" ? (
//                 <button
//                   onClick={() => {
//                     start();
//                     setRepeatCounter((state) => Number(state) + 1);
//                   }}
//                 >
//                   Start
//                 </button>
//               ) : (
//                 <>
//                   <button onClick={() => setIsLoop((state) => !state)}>
//                     {!isLoop ? "Loop" : "Off"}
//                   </button>
//                   <button onClick={pause}>Pause</button>
//                 </>
//               )}
//               <button
//                 onClick={() => {
//                   stop();
//                   setIsLoop(false);
//                 }}
//               >
//                 Stop
//               </button>
//               <div></div>
//             </div>
//           )}
//         </Speech>
//         <pre style={{ flex: "1", minHeight: "-webkit-fill-available" }}>
//           {affirmationText}
//         </pre>
//         <HighlightedText style={{ height: "26px" }}>
//           {affirmationText}
//         </HighlightedText>
//       </div>
//       <div>
//         <p>days: {dayStreak}</p>
//       </div>
//       {/* <Counter label="days" state={dayCounter} action={setDayCounter} /> */}
//       <Counter
//         label="repeats"
//         state={repeatCounter}
//         action={setRepeatCounter}
//       />
//     </div>
//   );
// }
