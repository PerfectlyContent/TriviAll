import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { CheckCircle2, XCircle, HelpCircle, ToggleLeft, PenLine, Target } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";
import { RoundType } from "../../services/gemini/gemini";

interface QuestionCardProps {
    player: { name: string; age: number; avatar_emoji?: string };
    question: string;
    options: string[];
    onSelect: (option: string) => void;
    selectedOption?: string;
    isRevealing: boolean;
    correctAnswer: string;
    accentColor: string;
    questionType?: RoundType;
    difficulty?: number;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

const QUESTION_TYPE_INFO: Record<string, { label: string; Icon: any }> = {
    "multiple_choice": { label: "Multiple Choice", Icon: HelpCircle },
    "true_false": { label: "True or False", Icon: ToggleLeft },
    "complete_phrase": { label: "Complete the Phrase", Icon: PenLine },
    "estimation": { label: "Estimation", Icon: Target },
};

export const QuestionCard = ({
    player,
    question,
    options,
    onSelect,
    selectedOption,
    isRevealing,
    correctAnswer,
    accentColor,
    questionType = "multiple_choice",
    difficulty,
}: QuestionCardProps) => {
    const typeInfo = QUESTION_TYPE_INFO[questionType] || QUESTION_TYPE_INFO["multiple_choice"];
    const TypeIcon = typeInfo.Icon;

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            style={[styles.card, { borderColor: `${accentColor}33` }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.playerInfo}>
                    <View style={[styles.avatar, { backgroundColor: accentColor }]}>
                        <Text style={styles.avatarText}>{player.avatar_emoji || "👤"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.typeBadge}>
                                <TypeIcon size={12} color={accentColor} />
                                <Text style={[styles.typeText, { color: accentColor }]}>{typeInfo.label}</Text>
                            </View>
                            {difficulty != null && (
                                <View style={[styles.difficultyBadge, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
                                    <Text style={[styles.difficultyText, { color: accentColor }]}>Lvl {difficulty}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* Question */}
            <Text style={styles.question}>{question}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
                {options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = isRevealing && option === correctAnswer;
                    const isWrong = isRevealing && isSelected && option !== correctAnswer;
                    const isUnselected = isRevealing && !isSelected && !isCorrect;

                    return (
                        <MotiView
                            key={index}
                            from={{ opacity: 0, translateX: -10 }}
                            animate={{
                                opacity: isUnselected ? 0.4 : 1,
                                translateX: 0,
                                scale: isCorrect ? 1.02 : 1,
                            }}
                            transition={{ delay: index * 50 }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    if (!isRevealing) {
                                        GameHaptics.select();
                                        onSelect(option);
                                    }
                                }}
                                disabled={isRevealing}
                                activeOpacity={0.7}
                                style={[
                                    styles.option,
                                    isSelected && !isRevealing && [styles.optionSelected, { borderColor: accentColor, backgroundColor: `${accentColor}22` }],
                                    isCorrect && styles.optionCorrect,
                                    isWrong && styles.optionWrong,
                                ]}
                            >
                                <View style={[
                                    styles.optionLetter,
                                    isSelected && !isRevealing && { backgroundColor: accentColor },
                                    isCorrect && styles.optionLetterCorrect,
                                    isWrong && styles.optionLetterWrong,
                                ]}>
                                    <Text style={[
                                        styles.optionLetterText,
                                        (isSelected || isCorrect || isWrong) && styles.optionLetterTextActive,
                                    ]}>
                                        {OPTION_LETTERS[index]}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.optionText,
                                    isSelected && !isRevealing && { color: 'white' },
                                    isCorrect && styles.optionTextCorrect,
                                    isWrong && styles.optionTextWrong,
                                ]} numberOfLines={3}>
                                    {option}
                                </Text>
                                {isCorrect && (
                                    <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                        <CheckCircle2 size={22} color="#10b981" />
                                    </MotiView>
                                )}
                                {isWrong && (
                                    <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                        <XCircle size={22} color="#ef4444" />
                                    </MotiView>
                                )}
                            </TouchableOpacity>
                        </MotiView>
                    );
                })}
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 22,
    },
    playerName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 17,
        marginBottom: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    typeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    question: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 30,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#1e293b',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
    },
    optionSelected: {},
    optionCorrect: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    optionWrong: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    optionLetterCorrect: {
        backgroundColor: '#10b981',
    },
    optionLetterWrong: {
        backgroundColor: '#ef4444',
    },
    optionLetterText: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 14,
    },
    optionLetterTextActive: {
        color: 'white',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#cbd5e1',
    },
    optionTextCorrect: {
        color: '#10b981',
        fontWeight: 'bold',
    },
    optionTextWrong: {
        color: '#ef4444',
    },
});
