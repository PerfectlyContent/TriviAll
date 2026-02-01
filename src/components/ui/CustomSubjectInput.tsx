import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Plus, X, PenLine } from "lucide-react-native";
import { validateCustomSubject, isPredefinedSubject, CUSTOM_SUBJECT_COLOR } from "../../constants/subjects";
import { GameHaptics } from "../../utils/sounds";

interface CustomSubjectInputProps {
    onAdd: (subject: string) => void;
    existingSubjects: string[];
    maxReached: boolean;
    placeholder?: string;
    compact?: boolean;
}

export const CustomSubjectInput = ({
    onAdd,
    existingSubjects,
    maxReached,
    placeholder = "e.g. Harry Potter, Formula 1...",
    compact = false,
}: CustomSubjectInputProps) => {
    const [text, setText] = useState("");
    const [error, setError] = useState("");

    const handleAdd = () => {
        setError("");

        if (maxReached) {
            setError("Max subjects reached");
            return;
        }

        const result = validateCustomSubject(text);
        if (!result.valid) {
            setError(result.error || "Invalid subject");
            GameHaptics.wrong();
            return;
        }

        // Check for duplicates (case-insensitive) against existing selections
        const isDuplicate = existingSubjects.some(
            s => s.toLowerCase() === result.sanitized.toLowerCase()
        );
        if (isDuplicate) {
            setError("Already in your list");
            GameHaptics.wrong();
            return;
        }

        // Check if it matches a predefined subject name — tell user to pick from grid
        if (isPredefinedSubject(result.sanitized)) {
            setError("That's already in the grid above — tap it!");
            GameHaptics.wrong();
            return;
        }

        GameHaptics.select();
        onAdd(result.sanitized);
        setText("");
        setError("");
    };

    return (
        <View style={styles.container}>
            <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
                <PenLine size={compact ? 14 : 16} color="#64748b" style={styles.icon} />
                <TextInput
                    style={[styles.input, compact && styles.inputCompact]}
                    value={text}
                    onChangeText={(t) => { setText(t); if (error) setError(""); }}
                    placeholder={maxReached ? "Max subjects reached" : placeholder}
                    placeholderTextColor="#475569"
                    maxLength={40}
                    autoCorrect={false}
                    editable={!maxReached}
                    returnKeyType="done"
                    onSubmitEditing={handleAdd}
                />
                <TouchableOpacity
                    onPress={handleAdd}
                    disabled={maxReached || !text.trim()}
                    style={[
                        styles.addButton,
                        compact && styles.addButtonCompact,
                        (maxReached || !text.trim()) && styles.addButtonDisabled,
                    ]}
                >
                    <Plus size={compact ? 16 : 18} color="white" />
                </TouchableOpacity>
            </View>
            {error ? <Text style={[styles.errorText, compact && styles.errorTextCompact]}>{error}</Text> : null}
        </View>
    );
};

// Custom subject chip with remove button
interface CustomSubjectChipProps {
    label: string;
    onRemove: () => void;
    compact?: boolean;
}

export const CustomSubjectChip = ({ label, onRemove, compact = false }: CustomSubjectChipProps) => {
    return (
        <View style={[styles.chip, compact && styles.chipCompact]}>
            <Text style={styles.chipIcon}>✏️</Text>
            <Text style={[styles.chipText, compact && styles.chipTextCompact]} numberOfLines={1}>{label}</Text>
            <TouchableOpacity onPress={() => { GameHaptics.select(); onRemove(); }} hitSlop={8} style={styles.chipRemove}>
                <X size={compact ? 12 : 14} color="#94a3b8" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0f172a",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#1e293b",
        borderStyle: "dashed",
        paddingLeft: 14,
        height: 52,
    },
    inputRowCompact: {
        height: 44,
        paddingLeft: 10,
        borderRadius: 10,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: "white",
        fontSize: 15,
        height: "100%",
    },
    inputCompact: {
        fontSize: 13,
    },
    addButton: {
        width: 44,
        height: "100%",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor: CUSTOM_SUBJECT_COLOR,
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonCompact: {
        width: 38,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    addButtonDisabled: {
        backgroundColor: "#334155",
        opacity: 0.5,
    },
    errorText: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "600",
        marginTop: 6,
        marginLeft: 4,
    },
    errorTextCompact: {
        fontSize: 11,
        marginTop: 4,
    },
    // Chip styles
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: "rgba(124, 58, 237, 0.08)",
        borderWidth: 1.5,
        borderColor: "rgba(124, 58, 237, 0.4)",
        borderStyle: "dashed",
    },
    chipCompact: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 4,
    },
    chipIcon: {
        fontSize: 13,
    },
    chipText: {
        color: "#c4b5fd",
        fontSize: 14,
        fontWeight: "600",
        maxWidth: 150,
    },
    chipTextCompact: {
        fontSize: 12,
        maxWidth: 120,
    },
    chipRemove: {
        padding: 2,
    },
});
