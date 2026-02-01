import "../global.css";
import { Stack } from "expo-router";
import { GameProvider } from "../context/GameContext";

export default function RootLayout() {
    return (
        <GameProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding/add-player" />
                <Stack.Screen name="onboarding/game-setup" />
                <Stack.Screen name="game/lobby" />
                <Stack.Screen name="game/round" options={{ gestureEnabled: false }} />
                <Stack.Screen name="game/results" options={{ gestureEnabled: false }} />
                <Stack.Screen name="game/game-over" />
            </Stack>
        </GameProvider>
    );
}
