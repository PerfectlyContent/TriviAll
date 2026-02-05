
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase credentials missing! Real-time features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export type GameData = {
    id: string;
    code: string;
    status: 'lobby' | 'playing' | 'finished';
    current_round_number: number;
    subjects: string[];
    current_round_subject: string | null;
    players_answered: string[];
    created_at: string;
    // Turn-based online multiplayer fields
    current_turn_player_id: string | null;
    current_turn_question: any | null;
    current_turn_answer: string | null;
    current_turn_correct: boolean | null;
    current_turn_phase: 'question' | 'revealing' | null;
};

export type PlayerData = {
    id: string;
    game_id: string;
    name: string;
    age: number;
    interests: string;
    avatar_emoji: string;
    is_ready: boolean;
    score: number;
    is_host: boolean;
    joined_at: string;
};
