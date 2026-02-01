import React, { useEffect } from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

// Legacy screen - player setup is now handled in game-setup.tsx
export default function AddPlayerScreen() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to game setup
        router.replace("/onboarding/game-setup");
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>Redirecting...</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#94a3b8',
        fontSize: 16,
    },
});
