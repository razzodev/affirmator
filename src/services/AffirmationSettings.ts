import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface AffirmationSettingsType {
    id?: string;
    affirmation_text: string;
    daily_goal: number;
    streak_goal: number;
    voice_speed: number;
    last_practice_date?: string;
    current_streak: number;
    daily_count: number;
    voice_name: string;
}

export interface ExportedSettings {
    version: number;
    settings: AffirmationSettingsType;
}

export const defaultSettings: AffirmationSettingsType = {
    id: uuidv4(),
    affirmation_text: "write your affirmation here",
    daily_goal: 100,
    streak_goal: 30,
    voice_speed: 1,
    last_practice_date: new Date().toISOString(),
    current_streak: 0,
    daily_count: 0,
    voice_name: 'Samantha',
};

export class AffirmationSettingsService {
    private dbPromise: Promise<IDBPDatabase> | null = null;
    private storeName = 'affirmationSettings';
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        this.initializationPromise = this.initializeDatabase();
    }

    private async initializeDatabase(): Promise<void> {
        this.dbPromise = openDB('AffirmationSettingsDB', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('affirmationSettings')) {
                    db.createObjectStore('affirmationSettings', { keyPath: 'id' });
                }
            },
        });
    }

    async create(settings: AffirmationSettingsType): Promise<AffirmationSettingsType> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return defaultSettings;
        }
        const db = await this.dbPromise;
        const id = settings.id || uuidv4();
        const settingsWithId = { ...settings, id };
        await db.put(this.storeName, settingsWithId);
        return settingsWithId;
    }

    async list(): Promise<AffirmationSettingsType[]> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return [defaultSettings];
        }
        const db = await this.dbPromise;
        const results = await db.getAll(this.storeName) as AffirmationSettingsType[];
        if (results.length === 0) {
            return [defaultSettings];
        }
        return results;
    }

    async update(id: string, settings: Partial<AffirmationSettingsType>): Promise<AffirmationSettingsType | undefined> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return defaultSettings;
        }
        const db = await this.dbPromise;
        const existingSettings = await db.get(this.storeName, id);
        if (!existingSettings) {
            return undefined;
        }
        const updatedSettings = { ...existingSettings, ...settings };
        delete updatedSettings.id; // remove id so it doesn't get overwritten.
        const newSettings = { ...existingSettings, ...settings, id: id }; // add id back.
        await db.put(this.storeName, newSettings);
        return newSettings;
    }

    async delete(id: string): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return;
        }
        const db = await this.dbPromise;
        await db.delete(this.storeName, id);
    }

    async exportSettings(settingsJson: AffirmationSettingsType[]): Promise<string | null> {
        const settings = settingsJson || await this.list();
        if (settings.length > 0) {
            return JSON.stringify(settings[0]);
        }
        return null;
    }

    async importSettings(settingsJson: string): Promise<AffirmationSettingsType | undefined> {
        try {
            const parsedData = JSON.parse(settingsJson);

            // Check if parsedData is an array and extract the first element
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                return await this.create(parsedData[0] as AffirmationSettingsType);
            }

            // Check if parsedData is a flat AffirmationSettingsType object
            if (typeof parsedData === 'object' && parsedData !== null && !('version' in parsedData)) {
                return await this.create(parsedData as AffirmationSettingsType);
            }

            // Check if parsedData is an ExportedSettings object
            if (typeof parsedData === 'object' && parsedData !== null && 'version' in parsedData) {
                const exportedSettings = parsedData as ExportedSettings;
                if (exportedSettings.version === 1) {
                    return await this.create(exportedSettings.settings);
                } else if (exportedSettings.version === 2) {
                    const migratedSettings = this.migrateSettingsV1toV2(exportedSettings.settings);
                    return await this.create(migratedSettings);
                }
            }

            console.error('Invalid JSON format for import.');
            return undefined;
        } catch (error) {
            console.error('Error importing settings:', error);
            return undefined;
        }
    }

    private migrateSettingsV1toV2(settings: AffirmationSettingsType): AffirmationSettingsType {
        // Migration logic here (if needed)
        return settings;
    }
}

export const affirmationSettingsService = new AffirmationSettingsService();
