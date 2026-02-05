import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    PLAYER_PROFILE: 'triviall_player_profile',
    PLAYER_STATS: 'triviall_player_stats',
    ACTIVE_SESSION: 'triviall_active_session',
};

export interface ActiveSession {
    gameId: string;
    playerId: string;
    gameCode: string;
    isHost: boolean;
    totalRounds: number;
    narratorStyle: string;
    savedAt: string;
}

export interface SavedProfile {
    name: string;
    avatar: string;
    interests: string[];
    lastPlayed: string;
}

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalCorrect: number;
    totalQuestions: number;
    bestStreak: number;
    favoriteCategory: string;
    totalPoints: number;
}

const DEFAULT_STATS: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestStreak: 0,
    favoriteCategory: 'General',
    totalPoints: 0,
};

export const PlayerStorage = {
    // Save player profile for quick return
    saveProfile: async (profile: SavedProfile): Promise<void> => {
        try {
            await AsyncStorage.setItem(KEYS.PLAYER_PROFILE, JSON.stringify(profile));
        } catch (e) {
            console.warn('Failed to save profile:', e);
        }
    },

    // Load saved profile
    loadProfile: async (): Promise<SavedProfile | null> => {
        try {
            const data = await AsyncStorage.getItem(KEYS.PLAYER_PROFILE);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Failed to load profile:', e);
            return null;
        }
    },

    // Save player stats
    saveStats: async (stats: PlayerStats): Promise<void> => {
        try {
            await AsyncStorage.setItem(KEYS.PLAYER_STATS, JSON.stringify(stats));
        } catch (e) {
            console.warn('Failed to save stats:', e);
        }
    },

    // Load player stats
    loadStats: async (): Promise<PlayerStats> => {
        try {
            const data = await AsyncStorage.getItem(KEYS.PLAYER_STATS);
            return data ? JSON.parse(data) : DEFAULT_STATS;
        } catch (e) {
            console.warn('Failed to load stats:', e);
            return DEFAULT_STATS;
        }
    },

    // Update stats after a game
    updateAfterGame: async (result: {
        won: boolean;
        correct: number;
        total: number;
        streak: number;
        points: number;
        topCategory: string;
    }): Promise<PlayerStats> => {
        const current = await PlayerStorage.loadStats();
        const updated: PlayerStats = {
            gamesPlayed: current.gamesPlayed + 1,
            gamesWon: current.gamesWon + (result.won ? 1 : 0),
            totalCorrect: current.totalCorrect + result.correct,
            totalQuestions: current.totalQuestions + result.total,
            bestStreak: Math.max(current.bestStreak, result.streak),
            favoriteCategory: result.topCategory || current.favoriteCategory,
            totalPoints: current.totalPoints + result.points,
        };
        await PlayerStorage.saveStats(updated);
        return updated;
    },

    // Active game session persistence (for rejoin after closing)
    saveActiveSession: async (session: ActiveSession): Promise<void> => {
        try {
            await AsyncStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
            console.log(`[STORAGE] Saved active session: game=${session.gameId}, player=${session.playerId}`);
        } catch (e) {
            console.warn('Failed to save active session:', e);
        }
    },

    loadActiveSession: async (): Promise<ActiveSession | null> => {
        try {
            const data = await AsyncStorage.getItem(KEYS.ACTIVE_SESSION);
            if (!data) return null;
            const session = JSON.parse(data) as ActiveSession;
            // Expire sessions older than 2 hours
            const savedAt = new Date(session.savedAt).getTime();
            if (Date.now() - savedAt > 2 * 60 * 60 * 1000) {
                await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
                return null;
            }
            return session;
        } catch (e) {
            console.warn('Failed to load active session:', e);
            return null;
        }
    },

    clearActiveSession: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
            console.log(`[STORAGE] Cleared active session`);
        } catch (e) {
            console.warn('Failed to clear active session:', e);
        }
    },

    // Clear all stored data
    clearAll: async (): Promise<void> => {
        try {
            await AsyncStorage.multiRemove([KEYS.PLAYER_PROFILE, KEYS.PLAYER_STATS, KEYS.ACTIVE_SESSION]);
        } catch (e) {
            console.warn('Failed to clear storage:', e);
        }
    },
};
