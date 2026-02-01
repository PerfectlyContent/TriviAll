import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { GameHaptics } from "../../utils/sounds";

interface DifficultySliderProps {
    value: number;
    onChange: (value: number) => void;
    accentColor?: string;
}

export const DifficultySlider = ({ value, onChange, accentColor = "#7c3aed" }: DifficultySliderProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.labelsRow}>
                <Text style={styles.labelLeft}>Easy</Text>
                <Text style={styles.labelRight}>Expert</Text>
            </View>
            <View style={styles.dotsRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                    const isSelected = level === value;
                    return (
                        <TouchableOpacity
                            key={level}
                            onPress={() => {
                                onChange(level);
                                GameHaptics.select();
                            }}
                            activeOpacity={0.7}
                            style={[
                                styles.dot,
                                isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                            ]}
                        >
                            <Text style={[styles.dotText, isSelected && styles.dotTextSelected]}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    labelsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 4,
    },
    labelLeft: {
        color: "#10b981",
        fontSize: 12,
        fontWeight: "600",
    },
    labelRight: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "600",
    },
    dotsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 4,
    },
    dot: {
        flex: 1,
        aspectRatio: 1,
        maxWidth: 36,
        borderRadius: 10,
        backgroundColor: "#0f172a",
        borderWidth: 2,
        borderColor: "#1e293b",
        alignItems: "center",
        justifyContent: "center",
    },
    dotText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "bold",
    },
    dotTextSelected: {
        color: "white",
    },
});
