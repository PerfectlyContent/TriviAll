import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, GameData, PlayerData } from "../services/supabase";
import { PlayerStorage, SavedProfile, PlayerStats, ActiveSession } from "../utils/storage";

export type NarratorStyle = "game_show" | "sarcastic" | "encouraging";

interface GameSettings {
    totalRounds: number;
    mode: "same_device" | "different_devices";
    playerCount: number;
    topic?: string;
    narratorStyle: NarratorStyle;
}

// Per-player game stats tracked during a game
export interface PlayerGameStats {
    score: number;
    correct: number;
    total: number;
    streak: number;
    bestStreak: number;
    lastAnswerCorrect: boolean;
    categoryHits: Record<string, number>;
    fastestAnswer: number | null; // ms
    pointsThisRound: number;
    difficulty: number; // 1-10
}

interface GameContextType {
    game: GameData | null;
    players: PlayerData[];
    settings: GameSettings;
    isHost: boolean;
    currentPlayerId: string | null;
    // Game stats per player
    gameStats: Record<string, PlayerGameStats>;
    // Game-wide subjects (host decides for everyone)
    gameSubjects: string[];
    // Saved profile
    savedProfile: SavedProfile | null;
    savedPlayerStats: PlayerStats | null;
    // Narrator
    getNarratorComment: (isCorrect: boolean, streak: number, playerName: string) => string;
    // Methods
    createGame: (hostName: string, avatar: string, interests: string, rounds: number, mode: string, narratorStyle?: NarratorStyle, age?: number, subjects?: string[]) => Promise<string>;
    createLocalGame: (hostName: string, avatar: string, interests: string, rounds: number, narratorStyle?: NarratorStyle, age?: number, playerCount?: number, difficultyLevel?: number, subjects?: string[]) => string;
    addLocalPlayer: (name: string, avatar: string, interests: string, age?: number, difficultyLevel?: number) => string;
    removeLocalPlayer: (playerId: string) => void;
    joinGame: (code: string, playerName: string, avatar: string, interests: string, age?: number) => Promise<string>;
    updatePlayerStatus: (isReady: boolean) => Promise<void>;
    leaveGame: () => void;
    kickPlayer: (playerId: string) => Promise<void>;
    updateSettings: (settings: Partial<GameSettings>) => void;
    startGame: () => Promise<void>;
    startLocalGame: () => void;
    resetGame: () => void;
    // Score management
    recordAnswer: (playerId: string, isCorrect: boolean, topic: string, answerTimeMs?: number) => void;
    getLeaderboard: () => Array<PlayerData & PlayerGameStats & { rank: number }>;
    getDifficultyForPlayer: (playerId: string) => number;
    setDifficultyForPlayer: (playerId: string, level: number) => void;
    // Subject tracking
    getLastSubjectForPlayer: (playerId: string) => string | null;
    setSubjectForPlayer: (playerId: string, subject: string) => void;
    // Subject pre-selection (kept for backward compat)
    getSelectedSubjectsForPlayer: (playerId: string) => string[];
    setSelectedSubjectsForPlayer: (playerId: string, subjects: string[]) => void;
    // Online round sync
    updateRoundSubject: (subject: string, roundNumber: number) => Promise<void>;
    markPlayerAnswered: (playerId: string) => Promise<void>;
    advanceToNextRound: (nextRound: number) => Promise<void>;
    // Turn-based online multiplayer
    startPlayerTurn: (playerId: string) => Promise<void>;
    broadcastQuestion: (question: any) => Promise<void>;
    submitTurnAnswer: (answer: string, isCorrect: boolean) => Promise<void>;
    advanceToNextTurn: () => Promise<void>;
    // Session & rejoin
    rejoinGame: () => Promise<boolean>;
    hasActiveSession: () => Promise<boolean>;
    clearSession: () => Promise<void>;
    // Profile persistence
    loadSavedProfile: () => Promise<void>;
    saveCurrentProfile: (name: string, avatar: string, interests: string[]) => Promise<void>;
    finalizeGame: (winnerId: string) => Promise<void>;
}

const NARRATOR_COMMENTS: Record<NarratorStyle, { correct: string[]; wrong: string[]; streak: string[]; comeback: string[] }> = {
    game_show: {
        correct: [
            "BOOM! That's correct!", "And the crowd goes wild!", "Nailed it! Absolutely brilliant!",
            "Right on the money!", "That's the answer we were looking for!", "Spectacular!",
        ],
        wrong: [
            "Ooh, not quite!", "The correct answer was just out of reach!", "So close, yet so far!",
            "A valiant effort!", "That one stumped even the best!", "Better luck on the next one!",
        ],
        streak: [
            "They're on FIRE! {streak} in a row!", "Can anyone stop {name}?! {streak}-streak!",
            "Unstoppable! {name} with {streak} consecutive correct answers!",
            "The streak continues! {name} is in the ZONE!",
        ],
        comeback: [
            "And {name} bounces back!", "The comeback is ON!", "That's the spirit, {name}!",
        ],
    },
    sarcastic: {
        correct: [
            "Oh wow, you actually knew that one.", "Look at you, using that brain.",
            "Correct. Don't let it go to your head.", "Even a broken clock is right twice a day... well done.",
            "I'd slow clap but I'm an AI.", "Someone's been doing their homework.",
        ],
        wrong: [
            "Oof. That was... a choice.", "Were you even trying?", "Bold answer. Wrong, but bold.",
            "I mean, that's ONE way to answer...", "The audacity of that guess.",
            "Have you considered just guessing the other one next time?",
        ],
        streak: [
            "Okay, {name}, we get it. You're smart. {streak} in a row.",
            "Is {name} cheating? {streak}-streak says maybe.",
            "{streak} correct? Are you really good or is everyone else really bad?",
        ],
        comeback: [
            "Oh, so you DO know things.", "Welcome back to planet correct answers.",
        ],
    },
    encouraging: {
        correct: [
            "Amazing job! You've got this!", "Wonderful! Your knowledge is shining!",
            "Perfectly done! Keep that momentum!", "That's the way! Brilliant thinking!",
            "You should be so proud of that answer!", "Fantastic! Your prep is paying off!",
        ],
        wrong: [
            "That's okay! You're learning something new!", "Don't worry, that was tricky!",
            "Every miss is a chance to learn! You've got the next one!",
            "That's a tough question - you're still doing great!",
            "Remember, it's about having fun! Great effort!",
            "You'll get the next one, I believe in you!",
        ],
        streak: [
            "Incredible, {name}! {streak} in a row! You're a star!",
            "Look at you go, {name}! {streak} correct! So impressive!",
            "You're absolutely glowing, {name}! {streak}-streak!",
        ],
        comeback: [
            "YES! I knew you had it in you, {name}!", "That's the comeback spirit!",
            "See? Never give up! Beautiful answer!",
        ],
    },
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const createDefaultStats = (difficultyLevel: number = 5): PlayerGameStats => ({
    score: 0,
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    lastAnswerCorrect: false,
    categoryHits: {},
    fastestAnswer: null,
    pointsThisRound: 0,
    difficulty: difficultyLevel,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [game, setGame] = useState<GameData | null>(null);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [settings, setSettings] = useState<GameSettings>({
        totalRounds: 5,
        mode: "same_device",
        playerCount: 1,
        narratorStyle: "game_show",
    });
    const [gameStats, setGameStats] = useState<Record<string, PlayerGameStats>>({});
    const [playerSubjects, setPlayerSubjects] = useState<Record<string, string>>({});
    const [playerSelectedSubjects, setPlayerSelectedSubjectsState] = useState<Record<string, string[]>>({});
    const [gameSubjects, setGameSubjects] = useState<string[]>([]);
    const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
    const [savedPlayerStats, setSavedPlayerStats] = useState<PlayerStats | null>(null);

    // Load saved profile on mount
    useEffect(() => {
        loadSavedProfile();
    }, []);

    // Initialize game stats when players change
    useEffect(() => {
        setGameStats(prev => {
            const updated = { ...prev };
            for (const player of players) {
                if (!updated[player.id]) {
                    updated[player.id] = createDefaultStats();
                }
            }
            return updated;
        });
    }, [players]);

    // Sync gameSubjects from game data (for online joiners)
    useEffect(() => {
        if (game?.subjects && game.subjects.length > 0) {
            setGameSubjects(game.subjects);
        }
    }, [game?.subjects]);

    // Subscribe to real-time changes (only for multi-device / Supabase games)
    useEffect(() => {
        if (!game?.id || game.id === "local") return;

        const gameSubscription = supabase
            .channel(`game:${game.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
                (payload) => {
                    const newGame = payload.new as GameData;
                    console.log(`[REALTIME] Game update: phase=${newGame.current_turn_phase}, turn=${newGame.current_turn_player_id?.slice(-4)}, round=${newGame.current_round_number}, status=${newGame.status}`);
                    setGame(newGame);
                }
            )
            .subscribe();

        const playersSubscription = supabase
            .channel(`players:${game.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` },
                async () => {
                    const { data } = await supabase
                        .from('players')
                        .select('*')
                        .eq('game_id', game.id)
                        .order('joined_at', { ascending: true });

                    if (data) setPlayers(data as PlayerData[]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(gameSubscription);
            supabase.removeChannel(playersSubscription);
        };
    }, [game?.id]);

    const getNarratorComment = (isCorrect: boolean, streak: number, playerName: string): string => {
        const style = NARRATOR_COMMENTS[settings.narratorStyle];

        if (isCorrect && streak >= 2 && style.streak.length > 0) {
            const template = style.streak[Math.floor(Math.random() * style.streak.length)];
            return template.replace(/\{name\}/g, playerName).replace(/\{streak\}/g, String(streak));
        }

        if (isCorrect && style.comeback.length > 0 && Math.random() < 0.3) {
            const template = style.comeback[Math.floor(Math.random() * style.comeback.length)];
            return template.replace(/\{name\}/g, playerName);
        }

        const pool = isCorrect ? style.correct : style.wrong;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const recordAnswer = (playerId: string, isCorrect: boolean, topic: string, answerTimeMs?: number) => {
        setGameStats(prev => {
            const current = prev[playerId] || createDefaultStats();
            const newStreak = isCorrect ? current.streak + 1 : 0;
            const streakMultiplier = newStreak >= 5 ? 2.5 : newStreak >= 3 ? 2 : newStreak >= 2 ? 1.5 : 1;
            const basePoints = 10;
            const pointsEarned = isCorrect ? Math.round(basePoints * streakMultiplier) : 0;

            const categoryHits = { ...current.categoryHits };
            if (topic) {
                categoryHits[topic] = (categoryHits[topic] || 0) + (isCorrect ? 1 : 0);
            }

            return {
                ...prev,
                [playerId]: {
                    score: current.score + pointsEarned,
                    correct: current.correct + (isCorrect ? 1 : 0),
                    total: current.total + 1,
                    streak: newStreak,
                    bestStreak: Math.max(current.bestStreak, newStreak),
                    lastAnswerCorrect: isCorrect,
                    categoryHits,
                    fastestAnswer: answerTimeMs != null
                        ? (current.fastestAnswer != null ? Math.min(current.fastestAnswer, answerTimeMs) : answerTimeMs)
                        : current.fastestAnswer,
                    pointsThisRound: pointsEarned,
                    difficulty: current.difficulty,
                },
            };
        });
    };

    const getDifficultyForPlayer = (playerId: string): number => {
        const stats = gameStats[playerId];
        if (!stats || stats.total < 2) return stats?.difficulty || 5;
        const accuracy = stats.correct / stats.total;
        let effective = stats.difficulty;
        if (accuracy >= 0.8 && stats.streak >= 2) {
            effective = Math.min(10, effective + 1);
        } else if (accuracy <= 0.3) {
            effective = Math.max(1, effective - 1);
        }
        return effective;
    };

    const setDifficultyForPlayer = (playerId: string, level: number) => {
        const clamped = Math.max(1, Math.min(10, Math.round(level)));
        setGameStats(prev => {
            const current = prev[playerId];
            if (!current) return prev;
            return { ...prev, [playerId]: { ...current, difficulty: clamped } };
        });
    };

    const getLastSubjectForPlayer = (playerId: string): string | null => {
        return playerSubjects[playerId] || null;
    };

    const setSubjectForPlayer = (playerId: string, subject: string) => {
        setPlayerSubjects(prev => ({ ...prev, [playerId]: subject }));
    };

    const getSelectedSubjectsForPlayer = (playerId: string): string[] => {
        return playerSelectedSubjects[playerId] || [];
    };

    const setSelectedSubjectsForPlayer = (playerId: string, subjects: string[]) => {
        setPlayerSelectedSubjectsState(prev => ({ ...prev, [playerId]: subjects }));
    };

    const getLeaderboard = () => {
        return players
            .map(player => ({
                ...player,
                ...(gameStats[player.id] || createDefaultStats()),
            }))
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({ ...player, rank: index + 1 }));
    };

    const createGame = async (hostName: string, avatar: string, interests: string, rounds: number, mode: string, narratorStyle: NarratorStyle = "game_show", age: number = 30, subjects: string[] = []) => {
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();

        const { data: gameData, error: gameError } = await supabase
            .from('games')
            .insert([{ code, status: 'lobby', subjects }])
            .select()
            .single();

        if (gameError || !gameData) throw new Error("Failed to create game");

        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .insert([{
                game_id: gameData.id,
                name: hostName,
                age,
                interests: interests || "General Knowledge",
                avatar_emoji: avatar || "👤",
                is_ready: true,
                is_host: true,
                score: 0
            }])
            .select()
            .single();

        if (playerError || !playerData) throw new Error("Failed to join as host");

        setGame(gameData);
        setPlayers([playerData]);
        setIsHost(true);
        setCurrentPlayerId(playerData.id);
        setSettings({ totalRounds: rounds, mode: "different_devices", playerCount: 0, narratorStyle });
        setGameStats({ [playerData.id]: createDefaultStats() });
        setGameSubjects(subjects);

        await PlayerStorage.saveProfile({
            name: hostName, avatar, interests: interests.split(", "),
            lastPlayed: new Date().toISOString(),
        });

        // Persist session for rejoin
        await PlayerStorage.saveActiveSession({
            gameId: gameData.id,
            playerId: playerData.id,
            gameCode: code,
            isHost: true,
            totalRounds: rounds,
            narratorStyle,
            savedAt: new Date().toISOString(),
        });

        return code;
    };

    const joinGame = async (code: string, playerName: string, avatar: string, interests: string, age: number = 25): Promise<string> => {
        const { data: gameData, error: gameError } = await supabase
            .from('games').select('*').eq('code', code.toUpperCase()).single();

        if (gameError || !gameData) throw new Error("Game not found");
        if (gameData.status !== 'lobby') throw new Error("Game already started");

        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .insert([{
                game_id: gameData.id, name: playerName, age,
                interests: interests || "General Knowledge",
                avatar_emoji: avatar || "👤",
                is_ready: false, is_host: false, score: 0
            }])
            .select().single();

        if (playerError) throw new Error("Failed to join game");

        const { data: currentPlayers } = await supabase
            .from('players').select('*').eq('game_id', gameData.id);

        setGame(gameData);
        setPlayers(currentPlayers || []);
        setIsHost(false);
        setCurrentPlayerId(playerData.id);
        // Load game-wide subjects from the game record
        if (gameData.subjects && Array.isArray(gameData.subjects)) {
            setGameSubjects(gameData.subjects);
        }

        await PlayerStorage.saveProfile({
            name: playerName, avatar, interests: interests.split(", "),
            lastPlayed: new Date().toISOString(),
        });

        // Persist session for rejoin
        await PlayerStorage.saveActiveSession({
            gameId: gameData.id,
            playerId: playerData.id,
            gameCode: code.toUpperCase(),
            isHost: false,
            totalRounds: settings.totalRounds,
            narratorStyle: settings.narratorStyle,
            savedAt: new Date().toISOString(),
        });

        return playerData.id;
    };

    const updatePlayerStatus = async (isReady: boolean) => {
        if (!currentPlayerId) return;
        await supabase.from('players').update({ is_ready: isReady }).eq('id', currentPlayerId);
    };

    const leaveGame = async () => {
        if (currentPlayerId) {
            await supabase.from('players').delete().eq('id', currentPlayerId);
        }
        resetGame();
    };

    const kickPlayer = async (playerId: string) => {
        if (!isHost) return;
        await supabase.from('players').delete().eq('id', playerId);
    };

    const startGame = async () => {
        if (!game || !isHost) return;
        // Sort players by join order for deterministic turn order
        const sortedPlayers = [...players].sort((a, b) =>
            a.joined_at.localeCompare(b.joined_at)
        );
        const firstPlayer = sortedPlayers[0];
        await supabase.from('games').update({
            status: 'playing',
            current_round_number: 1,
            players_answered: [],
            current_turn_player_id: firstPlayer?.id || null,
            current_turn_phase: firstPlayer ? 'question' : null,
            current_turn_question: null,
            current_turn_answer: null,
            current_turn_correct: null,
        }).eq('id', game.id);
    };

    // Online round sync methods
    const updateRoundSubject = async (subject: string, roundNumber: number) => {
        if (!game?.id || game.id === "local" || !isHost) return;
        await supabase.from('games').update({
            current_round_subject: subject,
            current_round_number: roundNumber,
            players_answered: [],
        }).eq('id', game.id);
    };

    const markPlayerAnswered = async (playerId: string) => {
        if (!game?.id || game.id === "local") return;
        const currentAnswered = game.players_answered || [];
        if (currentAnswered.includes(playerId)) return;
        await supabase.from('games').update({
            players_answered: [...currentAnswered, playerId],
        }).eq('id', game.id);
    };

    const advanceToNextRound = async (nextRound: number) => {
        if (!game?.id || game.id === "local" || !isHost) return;
        await supabase.from('games').update({
            current_round_number: nextRound,
            current_round_subject: null,
            players_answered: [],
            current_turn_player_id: null,
            current_turn_question: null,
            current_turn_answer: null,
            current_turn_correct: null,
            current_turn_phase: null,
        }).eq('id', game.id);
    };

    // Turn-based online multiplayer methods
    const startPlayerTurn = async (playerId: string) => {
        if (!game?.id || game.id === "local") return;
        console.log(`[GAME] startPlayerTurn: ${playerId}`);
        await supabase.from('games').update({
            current_turn_player_id: playerId,
            current_turn_phase: 'question',
            current_turn_question: null,
            current_turn_answer: null,
            current_turn_correct: null,
        }).eq('id', game.id);
    };

    const broadcastQuestion = async (question: any) => {
        if (!game?.id || game.id === "local") return;
        console.log(`[GAME] broadcastQuestion: topic=${question?.topic}`);
        await supabase.from('games').update({
            current_turn_question: question,
        }).eq('id', game.id);
    };

    const submitTurnAnswer = async (answer: string, isCorrect: boolean) => {
        if (!game?.id || game.id === "local") return;
        console.log(`[GAME] submitTurnAnswer: answer="${answer}", correct=${isCorrect}`);
        await supabase.from('games').update({
            current_turn_answer: answer,
            current_turn_correct: isCorrect,
            current_turn_phase: 'revealing',
        }).eq('id', game.id);
    };

    const advanceToNextTurn = async () => {
        if (!game?.id || game.id === "local") return;

        const answered = game.players_answered || [];
        const currentTurnPlayer = game.current_turn_player_id;

        // Add current player to answered list if not already there
        const updatedAnswered = currentTurnPlayer && !answered.includes(currentTurnPlayer)
            ? [...answered, currentTurnPlayer]
            : answered;

        // Find next player who hasn't answered (sorted by joined_at for deterministic order)
        const sortedPlayers = [...players].sort((a, b) =>
            a.joined_at.localeCompare(b.joined_at)
        );
        const nextPlayer = sortedPlayers.find(p => !updatedAnswered.includes(p.id));

        console.log(`[GAME] advanceToNextTurn: currentTurnPlayer=${currentTurnPlayer?.slice(-4)}, answered=${JSON.stringify(updatedAnswered.map(id => id.slice(-4)))}, players=${JSON.stringify(sortedPlayers.map(p => ({ name: p.name, id: p.id.slice(-4) })))}, nextPlayer=${nextPlayer?.name || 'NONE'} (${nextPlayer?.id?.slice(-4) || 'N/A'})`);

        if (nextPlayer) {
            // Start next player's turn
            await supabase.from('games').update({
                players_answered: updatedAnswered,
                current_turn_player_id: nextPlayer.id,
                current_turn_phase: 'question',
                current_turn_question: null,
                current_turn_answer: null,
                current_turn_correct: null,
            }).eq('id', game.id);
        } else {
            // All players done this round
            const nextRound = (game.current_round_number || 1) + 1;
            if (nextRound > settings.totalRounds) {
                // Game over
                console.log(`[GAME] All rounds done! Game finished.`);
                await supabase.from('games').update({
                    status: 'finished' as const,
                    players_answered: updatedAnswered,
                    current_turn_player_id: null,
                    current_turn_phase: null,
                    current_turn_question: null,
                    current_turn_answer: null,
                    current_turn_correct: null,
                }).eq('id', game.id);
            } else {
                // Advance to next round
                console.log(`[GAME] Advancing to round ${nextRound}`);
                await supabase.from('games').update({
                    current_round_number: nextRound,
                    current_round_subject: null,
                    players_answered: [],
                    current_turn_player_id: null,
                    current_turn_phase: null,
                    current_turn_question: null,
                    current_turn_answer: null,
                    current_turn_correct: null,
                }).eq('id', game.id);
            }
        }
    };

    // ===== Rejoin / Session persistence =====
    const hasActiveSession = async (): Promise<boolean> => {
        const session = await PlayerStorage.loadActiveSession();
        return session !== null;
    };

    const clearSession = async (): Promise<void> => {
        await PlayerStorage.clearActiveSession();
    };

    const rejoinGame = async (): Promise<boolean> => {
        const session = await PlayerStorage.loadActiveSession();
        if (!session) {
            console.log(`[REJOIN] No active session found`);
            return false;
        }

        console.log(`[REJOIN] Found session: game=${session.gameId}, player=${session.playerId}`);

        // Fetch the game
        const { data: gameData, error: gameError } = await supabase
            .from('games').select('*').eq('id', session.gameId).single();

        if (gameError || !gameData) {
            console.log(`[REJOIN] Game not found, clearing session`);
            await PlayerStorage.clearActiveSession();
            return false;
        }

        // If game is finished, clear session
        if (gameData.status === 'finished') {
            console.log(`[REJOIN] Game already finished, clearing session`);
            await PlayerStorage.clearActiveSession();
            return false;
        }

        // Verify our player still exists in the game
        const { data: playerData, error: playerError } = await supabase
            .from('players').select('*').eq('id', session.playerId).single();

        if (playerError || !playerData) {
            console.log(`[REJOIN] Player not found in game, clearing session`);
            await PlayerStorage.clearActiveSession();
            return false;
        }

        // Fetch all players
        const { data: allPlayers } = await supabase
            .from('players').select('*').eq('game_id', session.gameId).order('joined_at', { ascending: true });

        // Restore state
        setGame(gameData);
        setPlayers(allPlayers || []);
        setIsHost(session.isHost);
        setCurrentPlayerId(session.playerId);
        setSettings(prev => ({
            ...prev,
            totalRounds: session.totalRounds,
            mode: "different_devices",
            narratorStyle: (session.narratorStyle as NarratorStyle) || "game_show",
        }));

        // Restore subjects
        if (gameData.subjects && Array.isArray(gameData.subjects)) {
            setGameSubjects(gameData.subjects);
        }

        // Initialize stats for all players
        const statsInit: Record<string, PlayerGameStats> = {};
        for (const p of (allPlayers || [])) {
            statsInit[p.id] = createDefaultStats();
        }
        setGameStats(prev => ({ ...statsInit, ...prev }));

        console.log(`[REJOIN] ✅ Successfully rejoined game ${session.gameCode} as ${playerData.name} (${session.isHost ? 'host' : 'player'})`);
        return true;
    };

    const createLocalGame = (hostName: string, avatar: string, interests: string, rounds: number, narratorStyle: NarratorStyle = "game_show", age: number = 30, playerCount: number = 1, difficultyLevel: number = 5, subjects: string[] = []): string => {
        const localId = `local_${Date.now()}`;
        const hostPlayer: PlayerData = {
            id: localId,
            game_id: "local",
            name: hostName,
            age,
            interests: interests || "General Knowledge",
            avatar_emoji: avatar || "👤",
            is_ready: true,
            is_host: true,
            score: 0,
            joined_at: new Date().toISOString(),
        };
        setGame({ id: "local", code: "", status: "lobby", created_at: new Date().toISOString() } as GameData);
        setPlayers([hostPlayer]);
        setIsHost(true);
        setCurrentPlayerId(localId);
        setSettings({ totalRounds: rounds, mode: "same_device", playerCount, narratorStyle });
        setGameStats({ [localId]: createDefaultStats(difficultyLevel) });
        setPlayerSubjects({});
        setPlayerSelectedSubjectsState({});
        setGameSubjects(subjects);

        PlayerStorage.saveProfile({
            name: hostName, avatar, interests: interests.split(", "),
            lastPlayed: new Date().toISOString(),
        });

        return localId;
    };

    const addLocalPlayer = (name: string, avatar: string, interests: string, age: number = 30, difficultyLevel: number = 5): string => {
        const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newPlayer: PlayerData = {
            id: localId,
            game_id: "local",
            name,
            age,
            interests: interests || "General Knowledge",
            avatar_emoji: avatar || "👤",
            is_ready: true,
            is_host: false,
            score: 0,
            joined_at: new Date().toISOString(),
        };
        setPlayers(prev => [...prev, newPlayer]);
        setGameStats(prev => ({ ...prev, [localId]: createDefaultStats(difficultyLevel) }));
        return localId;
    };

    const removeLocalPlayer = (playerId: string) => {
        setPlayers(prev => prev.filter(p => p.id !== playerId));
        setGameStats(prev => {
            const updated = { ...prev };
            delete updated[playerId];
            return updated;
        });
    };

    const startLocalGame = () => {
        setGame(prev => prev ? { ...prev, status: "playing" } as GameData : prev);
    };

    const resetGame = () => {
        setGame(null);
        setPlayers([]);
        setIsHost(false);
        setCurrentPlayerId(null);
        setGameStats({});
        setPlayerSubjects({});
        setPlayerSelectedSubjectsState({});
        setGameSubjects([]);
        // Clear persisted session
        PlayerStorage.clearActiveSession();
    };

    const updateSettings = (newSettings: Partial<GameSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const loadSavedProfile = async () => {
        const profile = await PlayerStorage.loadProfile();
        const stats = await PlayerStorage.loadStats();
        setSavedProfile(profile);
        setSavedPlayerStats(stats);
    };

    const saveCurrentProfile = async (name: string, avatar: string, interests: string[]) => {
        const profile: SavedProfile = { name, avatar, interests, lastPlayed: new Date().toISOString() };
        await PlayerStorage.saveProfile(profile);
        setSavedProfile(profile);
    };

    const finalizeGame = async (winnerId: string) => {
        if (!currentPlayerId) return;
        const myStats = gameStats[currentPlayerId];
        if (!myStats) return;

        const topCategory = Object.entries(myStats.categoryHits)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || "General";

        const updatedStats = await PlayerStorage.updateAfterGame({
            won: winnerId === currentPlayerId,
            correct: myStats.correct,
            total: myStats.total,
            streak: myStats.bestStreak,
            points: myStats.score,
            topCategory,
        });
        setSavedPlayerStats(updatedStats);
    };

    return (
        <GameContext.Provider value={{
            game, players, settings, isHost, currentPlayerId,
            gameStats, gameSubjects, savedProfile, savedPlayerStats,
            getNarratorComment,
            createGame, createLocalGame, addLocalPlayer, removeLocalPlayer,
            joinGame, leaveGame, kickPlayer,
            updateSettings, startGame, startLocalGame, resetGame, updatePlayerStatus,
            recordAnswer, getLeaderboard, getDifficultyForPlayer, setDifficultyForPlayer,
            getLastSubjectForPlayer, setSubjectForPlayer,
            getSelectedSubjectsForPlayer, setSelectedSubjectsForPlayer,
            updateRoundSubject, markPlayerAnswered, advanceToNextRound,
            startPlayerTurn, broadcastQuestion, submitTurnAnswer, advanceToNextTurn,
            rejoinGame, hasActiveSession, clearSession,
            loadSavedProfile, saveCurrentProfile, finalizeGame,
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
