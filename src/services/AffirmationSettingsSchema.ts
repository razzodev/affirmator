interface AffirmationSettingsSchema {
    affirmation_text: {
        type: "string";
        description: string;
    };
    daily_goal: {
        type: "number";
        description: string;
        default: number;
    };
    streak_goal: {
        type: "number";
        description: string;
        default: number;
    };
    voice_speed: {
        type: "number";
        description: string;
        default: number;
        minimum: number;
        maximum: number;
    };
    last_practice_date: {
        type: "string"; // Or "Date" if you want to use Date objects directly
        description: string;
    };
    current_streak: {
        type: "number";
        description: string;
        default: number;
    };
    daily_count: {
        type: "number";
        description: string;
        default: number;
    };
}

const affirmationSettingsSchema: AffirmationSettingsSchema = {
    affirmation_text: {
        type: "string",
        description: "User's affirmation text",
    },
    daily_goal: {
        type: "number",
        description: "Number of daily repetitions goal",
        default: 10,
    },
    streak_goal: {
        type: "number",
        description: "Goal for consecutive days",
        default: 21,
    },
    voice_speed: {
        type: "number",
        description: "Speed of voice playback",
        default: 1,
        minimum: 0.5,
        maximum: 2,
    },
    last_practice_date: {
        type: "string", // Or "Date"
        description: "Last date the affirmation was practiced",
    },
    current_streak: {
        type: "number",
        description: "Current streak of consecutive days",
        default: 0,
    },
    daily_count: {
        type: "number",
        description: "Number of repetitions today",
        default: 0,
    },
};

interface AffirmationSettingsData {
    affirmation_text: string;
    daily_goal: number;
    streak_goal: number;
    voice_speed: number;
    last_practice_date: string; // Or Date
    current_streak: number;
    daily_count: number;
}

function validateAffirmationSettings(data: AffirmationSettingsData): boolean {
    if (typeof data.affirmation_text !== affirmationSettingsSchema.affirmation_text.type) {
        throw new Error("Invalid affirmation_text type");
    }
    if (typeof data.daily_goal !== affirmationSettingsSchema.daily_goal.type) {
        throw new Error("Invalid daily_goal type");
    }
    if (typeof data.streak_goal !== affirmationSettingsSchema.streak_goal.type) {
        throw new Error("Invalid streak_goal type");
    }
    if (typeof data.voice_speed !== affirmationSettingsSchema.voice_speed.type) {
        throw new Error("Invalid voice_speed type");
    }
    if (typeof data.current_streak !== affirmationSettingsSchema.current_streak.type) {
        throw new Error("Invalid current_streak type");
    }
    if (typeof data.daily_count !== affirmationSettingsSchema.daily_count.type) {
        throw new Error("Invalid daily_count type");
    }

    if (data.voice_speed < affirmationSettingsSchema.voice_speed.minimum || data.voice_speed > affirmationSettingsSchema.voice_speed.maximum) {
        throw new Error("voice_speed out of range");
    }

    return true;
}

const settingsData: AffirmationSettingsData = {
    affirmation_text: "I am awesome!",
    daily_goal: 15,
    streak_goal: 30,
    voice_speed: 1.2,
    last_practice_date: new Date().toISOString(),
    current_streak: 5,
    daily_count: 8,
};

try {
    validateAffirmationSettings(settingsData);
    console.log("Settings data is valid.");
} catch (error: unknown) {
    if (error instanceof Error) {
        console.error("Settings data is invalid:", error.message);
    }
}