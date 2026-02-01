import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Sound & Haptics utility for game feedback
// Uses expo-haptics for tactile feedback

export const GameHaptics = {
    // Correct answer - satisfying success tap
    correct: () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },

    // Wrong answer - subtle error buzz
    wrong: () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    },

    // Timer warning - light pulse
    timerWarning: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    },

    // Timer critical (<3s) - medium pulse
    timerCritical: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    },

    // Button press - light tap
    tap: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    },

    // Selection - medium tap
    select: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    },

    // Streak achieved - celebratory pattern
    streak: async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await new Promise(r => setTimeout(r, 100));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await new Promise(r => setTimeout(r, 100));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },

    // Game start countdown
    countdown: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    },

    // Winner celebration
    victory: async () => {
        if (Platform.OS !== 'web') {
            for (let i = 0; i < 3; i++) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                await new Promise(r => setTimeout(r, 150));
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },
};
