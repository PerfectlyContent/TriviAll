import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { MotiView } from "moti";
import { CheckCircle2, XCircle, HelpCircle, ToggleLeft, PenLine, Target, Send } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";
import { RoundType } from "../../services/gemini/gemini";
import { isFuzzyMatch } from "../../utils/answerMatching";

interface QuestionCardProps {
    player: { name: string; age: number; avatar_emoji?: string };
    question: string;
    options: string[];
    onSelect: (option: string) => void;
    selectedOption?: string;
    isRevealing: boolean;
    correctAnswer: string;
    acceptableAnswers?: string[];
    accentColor: string;
    questionType?: RoundType;
    difficulty?: number;
    readOnly?: boolean;
    spectatorAnswer?: string;
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
    acceptableAnswers = [],
    accentColor,
    questionType = "multiple_choice",
    difficulty,
    readOnly = false,
    spectatorAnswer,
}: QuestionCardProps) => {
    const typeInfo = QUESTION_TYPE_INFO[questionType] || QUESTION_TYPE_INFO["multiple_choice"];
    const TypeIcon = typeInfo.Icon;
    const isTextInput = (questionType === "complete_phrase" || questionType === "estimation") && (!options || options.length === 0);
    const [textAnswer, setTextAnswer] = useState("");
    const [textSubmitted, setTextSubmitted] = useState(false);

    // For spectator mode: use spectatorAnswer as the effective selected option
    const effectiveSelectedOption = spectatorAnswer ?? selectedOption;

    const handleTextSubmit = () => {
        if (!textAnswer.trim() || textSubmitted || isRevealing) return;
        setTextSubmitted(true);
        GameHaptics.select();
        onSelect(textAnswer.trim());
    };

    const textIsCorrect = textSubmitted ? isFuzzyMatch(textAnswer.trim(), correctAnswer, acceptableAnswers) : false;

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

            {/* Options or Text Input */}
            {isTextInput ? (
                <View style={styles.textInputContainer}>
                    <View style={[styles.textInputWrapper, { borderColor: isRevealing ? (textIsCorrect ? '#10b981' : '#ef4444') : `${accentColor}66` }]}>
                        <TextInput
                            style={styles.textInput}
                            value={readOnly && spectatorAnswer ? spectatorAnswer : textAnswer}
                            onChangeText={readOnly ? undefined : setTextAnswer}
                            placeholder={readOnly ? "Waiting for answer..." : (questionType === "estimation" ? "Enter a number..." : "Type your answer...")}
                            placeholderTextColor="#475569"
                            editable={!isRevealing && !textSubmitted && !readOnly}
                            keyboardType={questionType === "estimation" ? "numeric" : "default"}
                            returnKeyType="done"
                            onSubmitEditing={readOnly ? undefined : handleTextSubmit}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {!isRevealing && !textSubmitted && !readOnly && (
                            <TouchableOpacity
                                onPress={handleTextSubmit}
                                disabled={!textAnswer.trim()}
                                style={[styles.textSubmitBtn, { backgroundColor: accentColor }, !textAnswer.trim() && { opacity: 0.4 }]}
                            >
                                <Send size={18} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {isRevealing && (
                        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} style={styles.textRevealContainer}>
                            {textSubmitted && (
                                <View style={[styles.textResultBadge, { backgroundColor: textIsCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                                    {textIsCorrect ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                                    <Text style={[styles.textResultText, { color: textIsCorrect ? '#10b981' : '#ef4444' }]}>
                                        {textIsCorrect ? "Correct!" : "Not quite..."}
                                    </Text>
                                </View>
                            )}
                            {!textSubmitted && (
                                <View style={[styles.textResultBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                                    <XCircle size={18} color="#ef4444" />
                                    <Text style={[styles.textResultText, { color: '#ef4444' }]}>Time's up!</Text>
                                </View>
                            )}
                            <View style={styles.correctAnswerBox}>
                                <Text style={styles.correctAnswerLabel}>Correct Answer</Text>
                                <Text style={[styles.correctAnswerValue, { color: accentColor }]}>{correctAnswer}</Text>
                            </View>
                        </MotiView>
                    )}
                </View>
            ) : (
                <View style={styles.optionsContainer}>
                    {options.map((option, index) => {
                        const isSelected = effectiveSelectedOption === option;
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
                                        if (!isRevealing && !readOnly) {
                                            GameHaptics.select();
                                            onSelect(option);
                                        }
                                    }}
                                    disabled={isRevealing || readOnly}
                                    activeOpacity={readOnly ? 1 : 0.7}
                                    style={[
                                        styles.option,
                                        isSelected && !isRevealing && [styles.optionSelected, { borderColor: accentColor, backgroundColor: `${accentColor}22` }],
                                        isCorrect && styles.optionCorrect,
                                        isWrong && styles.optionWrong,
                                        readOnly && !isRevealing && { opacity: 0.8 },
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
            )}
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
    // Text input styles
    textInputContainer: {
        gap: 12,
    },
    textInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        paddingRight: 6,
    },
    textInput: {
        flex: 1,
        padding: 16,
        color: 'white',
        fontSize: 18,
        fontWeight: '500',
    },
    textSubmitBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textRevealContainer: {
        gap: 10,
    },
    textResultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    textResultText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    correctAnswerBox: {
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    correctAnswerLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    correctAnswerValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
});
