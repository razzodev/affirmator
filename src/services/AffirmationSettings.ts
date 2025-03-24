import { v4 as uuidv4 } from 'uuid';
import { openDB, IDBPDatabase } from 'idb';

interface AffirmationSettingsBase {
    affirmation_text: string;
    daily_goal: number;
    streak_goal: number;
    voice_speed: number;
    last_practice_date: string;
    current_streak: number;
    daily_count: number;
    voice_name?: string;
}

export interface AffirmationSettingsType extends AffirmationSettingsBase {
    id: string;
}

export type AffirmationSettingsUpdate = Partial<AffirmationSettingsBase>;

interface ExportedSettings {
    settings: AffirmationSettingsType;
    version: number;
}

export const defaultSettings: AffirmationSettingsType = {
    id: uuidv4(),
    affirmation_text: 'write your affirmation here',
    daily_goal: 100,
    streak_goal: 30,
    voice_speed: 1,
    last_practice_date: new Date().toISOString(),
    current_streak: 0,
    daily_count: 0,
    voice_name: 'Samantha',
};

export class AffirmationSettingsService {
    private dbPromise: Promise<IDBPDatabase<unknown>> | null = null;
    private storeName = 'affirmationSettings';
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        this.initializationPromise = this.initClass();
    }

    private async initClass(): Promise<void> {
        if (typeof window === 'undefined') {
            return;
        }
        this.dbPromise = openDB('AffirmationSettingsDB', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('affirmationSettings')) {
                    db.createObjectStore('affirmationSettings', { keyPath: 'id' }); // Use keyPath 'id'
                }
            },
        });
        await this.dbPromise;
    }

    async list(): Promise<AffirmationSettingsType[]> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return [defaultSettings]; // Return default settings as array
        }
        const db = await this.dbPromise;
        return await db.getAll(this.storeName) as AffirmationSettingsType[];
    }

    async create(settings: AffirmationSettingsBase): Promise<AffirmationSettingsType | undefined> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return undefined;
        }
        const db = await this.dbPromise;
        const newSettings = { ...settings, id: uuidv4() };
        await db.put(this.storeName, newSettings);
        return newSettings;
    }

    async update(id: string, updates: AffirmationSettingsUpdate): Promise<AffirmationSettingsType | undefined> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return undefined;
        }
        const db = await this.dbPromise;
        const existing = await db.get(this.storeName, id);
        if (!existing) {
            return undefined;
        }
        const updated = {
            ...existing,
            ...updates,
            voice_speed: updates.voice_speed !== undefined ? Math.min(Math.max(updates.voice_speed, 0.5), 2) : existing.voice_speed,
            voice_name: updates.voice_name !== undefined ? updates.voice_name : existing.voice_name,
        };
        await db.put(this.storeName, updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.dbPromise) {
            return false;
        }
        const db = await this.dbPromise;
        await db.delete(this.storeName, id);
        return true;
    }

    async exportSettings(): Promise<string | null> {
        const settings = await this.list();
        if (settings.length > 0) {
            return JSON.stringify(settings);
        }
        return null;
    }

    async importSettings(settingsJson: string): Promise<AffirmationSettingsType | undefined> {
        try {
            const parsedData: ExportedSettings | AffirmationSettingsType = JSON.parse(settingsJson);

            if (typeof (parsedData as ExportedSettings).version === 'number') {
                const exportedSettings = parsedData as ExportedSettings;
                if (exportedSettings.version === 1) {
                    return await this.create(exportedSettings.settings);
                } else if (exportedSettings.version === 2) {
                    const migratedSettings = this.migrateSettingsV1toV2(exportedSettings.settings);
                    return await this.create(migratedSettings);
                }
            } else {
                return await this.create(parsedData as AffirmationSettingsType);
            }
        } catch (error) {
            console.error('Error importing settings:', error);
        }
        return undefined;
    }

    private migrateSettingsV1toV2(oldSettings: AffirmationSettingsType): AffirmationSettingsType {
        const newSettings = { ...oldSettings };
        if (!newSettings.voice_name) {
            newSettings.voice_name = 'Default Voice';
        }
        return newSettings;
    }
}

export const affirmationSettingsService = new AffirmationSettingsService();

export { handleStreakUpdate } from './AffirmationSettingsUtils'