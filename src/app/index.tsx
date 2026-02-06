import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Zap, TrendingUp, Award, Target, RefreshCw } from "lucide-react-native";
import { useGame } from "../context/GameContext";
import { GameHaptics } from "../utils/sounds";
import { PlayerStorage } from "../utils/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    y: 100 + Math.random() * 600,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 3000,
    duration: 4000 + Math.random() * 4000,
    opacity: 0.05 + Math.random() * 0.15,
}));

export default function WelcomeScreen() {
    const router = useRouter();
    const { savedProfile, savedPlayerStats, rejoinGame, game } = useGame();
    const [showStats, setShowStats] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const [isRejoining, setIsRejoining] = useState(false);
    const [rejoinError, setRejoinError] = useState<string | null>(null);

    // Check for active session on mount
    useEffect(() => {
        const checkSession = async () => {
            const session = await PlayerStorage.loadActiveSession();
            if (session) {
                setHasSession(true);
                console.log(`[HOME] Found active session for game ${session.gameCode}`);
            }
        };
        checkSession();
    }, []);

    // If we already rejoined and game is loaded + playing, navigate
    useEffect(() => {
        if (isRejoining && game?.status === 'playing') {
            setIsRejoining(false);
            router.push("/game/round");
        } else if (isRejoining && game?.status === 'lobby') {
            setIsRejoining(false);
            router.push("/game/lobby");
        }
    }, [game?.status, isRejoining]);

    const handleRejoin = async () => {
        setIsRejoining(true);
        setRejoinError(null);
        try {
            const success = await rejoinGame();
            if (!success) {
                setIsRejoining(false);
                setHasSession(false);
                setRejoinError("Couldn't rejoin — the game may have ended.");
            }
            // If success, the useEffect above will navigate when game state loads
        } catch (e: any) {
            setIsRejoining(false);
            setHasSession(false);
            setRejoinError(e.message || "Failed to rejoin game");
        }
    };

    const handleDismissRejoin = async () => {
        await PlayerStorage.clearActiveSession();
        setHasSession(false);
    };

    useEffect(() => {
        if (savedProfile && savedPlayerStats && savedPlayerStats.gamesPlayed > 0) {
            setShowStats(true);
        }
    }, [savedProfile, savedPlayerStats]);

    const winRate = savedPlayerStats && savedPlayerStats.gamesPlayed > 0
        ? Math.round((savedPlayerStats.gamesWon / savedPlayerStats.gamesPlayed) * 100)
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Animated background particles */}
            <View style={styles.particlesContainer} pointerEvents="none">
                {PARTICLES.map((p) => (
                    <MotiView
                        key={p.id}
                        from={{ translateY: p.y, translateX: p.x, opacity: 0 }}
                        animate={{ translateY: p.y - 200, translateX: p.x + (Math.random() > 0.5 ? 30 : -30), opacity: p.opacity }}
                        transition={{ type: "timing", duration: p.duration, delay: p.delay, loop: true }}
                        style={[styles.particle, { width: p.size, height: p.size, borderRadius: p.size / 2 }]}
                    />
                ))}
            </View>

            <View style={styles.content}>
                {/* Welcome back banner */}
                {showStats && savedProfile && (
                    <MotiView
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 200, type: "timing", duration: 600 }}
                        style={styles.welcomeBack}
                    >
                        <Text style={styles.welcomeBackText}>
                            Welcome back, {savedProfile.name}! {savedProfile.avatar}
                        </Text>
                    </MotiView>
                )}

                {/* Logo */}
                <MotiView
                    from={{ opacity: 0, scale: 0.5, translateY: -20 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ type: "spring", duration: 1500 }}
                    style={styles.logoContainer}
                >
                    <View style={styles.iconBox}>
                        <MotiView
                            from={{ opacity: 0.3, scale: 1 }}
                            animate={{ opacity: 0.7, scale: 1.3 }}
                            transition={{ type: "timing", duration: 2000, loop: true }}
                            style={styles.iconGlow}
                        />
                        <Zap size={48} color="white" />
                    </View>
                    <Text style={styles.title}>
                        Trivi<Text style={styles.titleAccent}>All</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Fair play for everyone, powered by AI.
                    </Text>
                </MotiView>

                {/* Stats card for returning players */}
                {showStats && savedPlayerStats && savedPlayerStats.gamesPlayed > 0 && (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 400, type: "spring" }}
                        style={styles.statsCard}
                    >
                        <View style={styles.statItem}>
                            <Award size={16} color="#f59e0b" />
                            <Text style={styles.statValue}>{savedPlayerStats.gamesPlayed}</Text>
                            <Text style={styles.statLabel}>Games</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <TrendingUp size={16} color="#10b981" />
                            <Text style={styles.statValue}>{winRate}%</Text>
                            <Text style={styles.statLabel}>Win Rate</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Target size={16} color="#ef4444" />
                            <Text style={styles.statValue}>{savedPlayerStats.bestStreak}</Text>
                            <Text style={styles.statLabel}>Best Streak</Text>
                        </View>
                    </MotiView>
                )}

                {/* Rejoin banner */}
                {hasSession && (
                    <MotiView
                        from={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.rejoinBanner}
                    >
                        <Text style={styles.rejoinTitle}>🎮 Game in Progress</Text>
                        <Text style={styles.rejoinSubtitle}>You have an active game session</Text>
                        <View style={styles.rejoinButtons}>
                            <TouchableOpacity
                                onPress={handleRejoin}
                                disabled={isRejoining}
                                style={styles.rejoinButton}
                            >
                                {isRejoining ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <RefreshCw size={18} color="white" />
                                        <Text style={styles.rejoinButtonText}>Rejoin Game</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDismissRejoin} style={styles.rejoinDismiss}>
                                <Text style={styles.rejoinDismissText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                        {rejoinError && <Text style={styles.rejoinError}>{rejoinError}</Text>}
                    </MotiView>
                )}

                {/* Buttons */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 500, type: "timing", duration: 1000 }}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity
                        onPress={() => {
                            GameHaptics.tap();
                            router.push("/onboarding/game-setup");
                        }}
                        activeOpacity={0.8}
                        style={[styles.button, styles.hostButton]}
                    >
                        <MotiView
                            from={{ translateX: -150 }}
                            animate={{ translateX: 400 }}
                            transition={{ type: "timing", duration: 3000, loop: true, delay: 1000 }}
                            style={styles.buttonShine}
                        />
                        <Zap size={22} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Host New Game</Text>
                    </TouchableOpacity>

                    <View style={{ height: 16 }} />

                    <TouchableOpacity
                        onPress={() => {
                            GameHaptics.tap();
                            router.push("/onboarding/join");
                        }}
                        activeOpacity={0.8}
                        style={[styles.button, styles.joinButton]}
                    >
                        <Text style={[styles.buttonText, styles.joinButtonText]}>Join Game</Text>
                    </TouchableOpacity>
                </MotiView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    particle: {
        position: "absolute",
        backgroundColor: "#7c3aed",
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    welcomeBack: {
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 24,
    },
    welcomeBackText: {
        color: '#a78bfa',
        fontSize: 15,
        fontWeight: '600',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconBox: {
        width: 96,
        height: 96,
        backgroundColor: '#7c3aed',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
        marginBottom: 24,
        overflow: "hidden",
    },
    iconGlow: {
        position: "absolute",
        width: 96,
        height: 96,
        backgroundColor: "#a78bfa",
        borderRadius: 28,
    },
    title: {
        fontSize: 52,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: -2,
        marginBottom: 8,
    },
    titleAccent: {
        color: '#7c3aed',
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '500',
        maxWidth: 300,
    },
    statsCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
    statLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#1e293b",
        marginHorizontal: 12,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        width: '100%',
        backgroundColor: '#7c3aed',
        height: 64,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
        overflow: "hidden",
    },
    buttonShine: {
        position: "absolute",
        top: 0,
        width: 60,
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.12)",
        transform: [{ skewX: "-20deg" }],
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    hostButton: {
        backgroundColor: '#7c3aed',
    },
    joinButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#7c3aed',
        shadowOpacity: 0,
    },
    joinButtonText: {
        color: '#7c3aed',
    },
    // Rejoin styles
    rejoinBanner: {
        width: '100%',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    rejoinTitle: {
        color: '#10b981',
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    rejoinSubtitle: {
        color: '#94a3b8',
        fontSize: 13,
        marginBottom: 12,
    },
    rejoinButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    rejoinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    rejoinButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    rejoinDismiss: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    rejoinDismissText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    rejoinError: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: 8,
        fontWeight: '600',
    },
});
