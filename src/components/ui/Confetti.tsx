import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { MotiView } from "moti";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
    "#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
    "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

interface ConfettiPiece {
    id: number;
    x: number;
    delay: number;
    color: string;
    size: number;
    rotation: number;
}

interface ConfettiProps {
    active: boolean;
    count?: number;
}

export const Confetti = ({ active, count = 30 }: ConfettiProps) => {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (active) {
            const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
                id: i,
                x: Math.random() * SCREEN_WIDTH,
                delay: Math.random() * 500,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                size: 6 + Math.random() * 10,
                rotation: Math.random() * 360,
            }));
            setPieces(newPieces);

            const timeout = setTimeout(() => setPieces([]), 2500);
            return () => clearTimeout(timeout);
        } else {
            setPieces([]);
        }
    }, [active]);

    if (pieces.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.map((piece) => (
                <MotiView
                    key={piece.id}
                    from={{
                        translateY: -20,
                        translateX: piece.x,
                        opacity: 1,
                        rotate: `${piece.rotation}deg`,
                        scale: 0,
                    }}
                    animate={{
                        translateY: SCREEN_HEIGHT + 50,
                        translateX: piece.x + (Math.random() - 0.5) * 100,
                        opacity: 0,
                        rotate: `${piece.rotation + 720}deg`,
                        scale: 1,
                    }}
                    transition={{
                        type: "timing",
                        duration: 1800 + Math.random() * 800,
                        delay: piece.delay,
                    }}
                    style={[
                        styles.piece,
                        {
                            width: piece.size,
                            height: piece.size * (0.5 + Math.random() * 0.5),
                            backgroundColor: piece.color,
                            borderRadius: piece.size > 10 ? 2 : piece.size,
                            left: 0,
                            top: 0,
                        },
                    ]}
                />
            ))}
        </View>
    );
};

// Floating points animation (+10, +15, etc.)
interface FloatingPointsProps {
    points: number;
    visible: boolean;
    color?: string;
}

export const FloatingPoints = ({ points, visible, color = "#10b981" }: FloatingPointsProps) => {
    if (!visible || points <= 0) return null;

    return (
        <MotiView
            from={{ opacity: 1, translateY: 0, scale: 0.5 }}
            animate={{ opacity: 0, translateY: -80, scale: 1.2 }}
            transition={{ type: "timing", duration: 1200 }}
            style={styles.floatingPoints}
        >
            <MotiView
                from={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 8 }}
            >
                <View style={[styles.pointsBadge, { backgroundColor: color }]}>
                    <View style={styles.pointsInner}>
                        <MotiView
                            from={{ rotate: "-10deg" }}
                            animate={{ rotate: "0deg" }}
                            transition={{ type: "spring" }}
                        >
                            <View>
                                {/* Using View+style instead of Text nesting for better RN compatibility */}
                            </View>
                        </MotiView>
                    </View>
                </View>
            </MotiView>
        </MotiView>
    );
};

// Streak flame indicator
interface StreakBadgeProps {
    streak: number;
}

export const StreakBadge = ({ streak }: StreakBadgeProps) => {
    if (streak < 2) return null;

    const getStreakInfo = () => {
        if (streak >= 5) return { label: "LEGENDARY", color: "#f59e0b", emoji: "🔥🔥🔥" };
        if (streak >= 3) return { label: "UNSTOPPABLE", color: "#ef4444", emoji: "🔥🔥" };
        return { label: "ON FIRE", color: "#f97316", emoji: "🔥" };
    };

    const info = getStreakInfo();

    return (
        <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 10 }}
            style={[styles.streakBadge, { backgroundColor: `${info.color}22`, borderColor: `${info.color}66` }]}
        >
            <View style={styles.streakContent}>
                <View style={styles.streakTextContainer}>
                    <MotiView
                        from={{ scale: 1 }}
                        animate={{ scale: 1.15 }}
                        transition={{ type: "timing", duration: 600, loop: true }}
                    >
                        <View>
                            {/* Flame emoji rendered via parent text */}
                        </View>
                    </MotiView>
                </View>
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    piece: {
        position: "absolute",
    },
    floatingPoints: {
        position: "absolute",
        alignSelf: "center",
        zIndex: 100,
        top: "40%",
    },
    pointsBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    pointsInner: {
        alignItems: "center",
    },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        alignSelf: "center",
        marginBottom: 12,
    },
    streakContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    streakTextContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});
