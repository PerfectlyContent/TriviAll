import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MotiView } from "moti";
import { GameHaptics } from "../../utils/sounds";

interface TimerProps {
    duration: number;
    onExpire: () => void;
    isActive: boolean;
}

export const Timer = ({ duration, onExpire, isActive }: TimerProps) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const hasTriggeredWarning = useRef(false);
    const size = 68;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        setTimeLeft(duration);
        hasTriggeredWarning.current = false;
    }, [duration]);

    useEffect(() => {
        if (!isActive || timeLeft < 0) return;

        if (timeLeft === 0) {
            const timer = setTimeout(() => {
                GameHaptics.timerCritical();
                onExpire();
            }, 0);
            return () => clearTimeout(timer);
        }

        // Haptic feedback at warning thresholds
        if (timeLeft <= 5 && timeLeft > 0) {
            GameHaptics.timerWarning();
        }
        if (timeLeft <= 3 && timeLeft > 0) {
            GameHaptics.timerCritical();
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onExpire]);

    const progress = timeLeft / duration;
    const offset = circumference - progress * circumference;

    const getColor = () => {
        if (progress > 0.5) return "#10b981";
        if (progress > 0.25) return "#f59e0b";
        return "#ef4444";
    };

    const isUrgent = timeLeft <= 5;
    const isCritical = timeLeft <= 3;
    const color = getColor();

    return (
        <MotiView
            animate={{
                scale: isCritical ? 1.15 : isUrgent ? 1.08 : 1,
            }}
            transition={{
                type: "timing",
                duration: isCritical ? 300 : 400,
                loop: isUrgent,
            }}
            style={styles.wrapper}
        >
            {/* Glow effect when urgent */}
            {isUrgent && (
                <MotiView
                    from={{ opacity: 0.3, scale: 1 }}
                    animate={{ opacity: 0.8, scale: 1.3 }}
                    transition={{ type: "timing", duration: 500, loop: true }}
                    style={[styles.glow, { backgroundColor: color }]}
                />
            )}

            <View style={[styles.container, isUrgent && { shadowColor: color, shadowOpacity: 0.8, shadowRadius: 16 }]}>
                <Svg width={size} height={size}>
                    {/* Background track */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#1e293b"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress arc */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={isUrgent ? strokeWidth + 2 : strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </Svg>
                <View style={styles.textContainer}>
                    <MotiView
                        animate={{ scale: isCritical ? 1.2 : 1 }}
                        transition={{ type: "spring", damping: 10 }}
                    >
                        <Text style={[
                            styles.timeText,
                            { color },
                            isCritical && styles.timeTextCritical,
                        ]}>
                            {Math.ceil(timeLeft)}
                        </Text>
                    </MotiView>
                </View>
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    glow: {
        position: "absolute",
        width: 68,
        height: 68,
        borderRadius: 34,
        opacity: 0.3,
    },
    container: {
        width: 68,
        height: 68,
        alignItems: "center",
        justifyContent: "center",
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },
    textContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    timeText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    timeTextCritical: {
        fontSize: 22,
        fontWeight: "900",
    },
});
