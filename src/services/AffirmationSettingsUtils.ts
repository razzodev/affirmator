import { format } from 'date-fns'
import { AffirmationSettingsType, AffirmationSettingsService, defaultSettings } from "@/services/AffirmationSettings";

export const handleStreakUpdate = async (settings: AffirmationSettingsType, settingsService: AffirmationSettingsService, callback: React.Dispatch<React.SetStateAction<AffirmationSettingsType | null>>) => {
    const isPracticedToday = format(new Date(settings.last_practice_date), "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")
    const isPracticedYesterday = format(new Date(settings.last_practice_date), "yyyy-MM-dd") === format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd")

    if (!isPracticedToday) {
        if (isPracticedYesterday) {
            await settingsService.update(settings.id, {
                daily_count: 0,
                current_streak: settings.current_streak + 1,
                last_practice_date: new Date().toISOString(),
            })
        } else {
            await settingsService.update(settings.id, {
                daily_count: 0,
                last_practice_date: new Date().toISOString(),
                current_streak: 0,
            })
        }
        const updatedSettings = await settingsService.list();
        if (updatedSettings.length > 0) callback(updatedSettings[0]);

    } else {
        const newSettings = await settingsService.create(defaultSettings);
        if (newSettings !== undefined) callback(newSettings);
    }
};