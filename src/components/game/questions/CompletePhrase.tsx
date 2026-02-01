import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react-native";
import { isFuzzyMatch } from "../../../utils/answerMatching";

interface CompletePhraseProps {
    player: { name: string; age: number };
    question: string;
    onSubmit: (answer: string) => void;
    submittedAnswer?: string;
    isRevealing?: boolean;
    correctAnswer: string;
    acceptableAnswers?: string[];
}

export const CompletePhrase = ({
    player,
    question,
    onSubmit,
    submittedAnswer,
    isRevealing,
    correctAnswer,
    acceptableAnswers = [],
}: CompletePhraseProps) => {
    const [answer, setAnswer] = useState("");

    const handleSubmit = () => {
        if (answer.trim()) {
            onSubmit(answer.trim());
        }
    };

    const isCorrect = submittedAnswer && isFuzzyMatch(submittedAnswer, correctAnswer, acceptableAnswers);

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.card}
        >
            <View style={styles.header}>
                <View style={styles.playerInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{player.name[0].toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerAge}>Age {player.age}</Text>
                    </View>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>FILL IN THE BLANK</Text>
                </View>
            </View>

            <Text style={styles.question}>{question}</Text>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <Sparkles size={20} color="#7c3aed" style={styles.inputIcon} />
                    <TextInput
                        value={isRevealing ? submittedAnswer : answer}
                        onChangeText={setAnswer}
                        placeholder="Type your answer..."
                        placeholderTextColor="#475569"
                        editable={!isRevealing}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                            styles.input,
                            isRevealing && isCorrect && styles.inputCorrect,
                            isRevealing && !isCorrect && styles.inputWrong,
                        ]}
                    />
                    {isRevealing && (
                        <View style={styles.feedbackIcon}>
                            {isCorrect ? (
                                <CheckCircle2 size={24} color="#10b981" />
                            ) : (
                                <XCircle size={24} color="#ef4444" />
                            )}
                        </View>
                    )}
                </View>

                {!isRevealing && (
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!answer.trim()}
                        style={[styles.submitButton, !answer.trim() && styles.submitButtonDisabled]}
                    >
                        <Text style={styles.submitButtonText}>Submit Answer</Text>
                    </TouchableOpacity>
                )}

                {isRevealing && !isCorrect && (
                    <MotiView
                        from={{ opacity: 0, translateY: -10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={styles.correctAnswerContainer}
                    >
                        <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
                        <Text style={styles.correctAnswerText}>{correctAnswer}</Text>
                    </MotiView>
                )}
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
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
        marginBottom: 24,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    playerName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    playerAge: {
        color: '#64748b',
        fontSize: 12,
    },
    badge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    question: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 32,
        marginBottom: 32,
    },
    inputContainer: {
        gap: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#1e293b',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 64,
        color: 'white',
        fontSize: 18,
        fontWeight: '500',
    },
    inputCorrect: {
        borderColor: '#10b981',
    },
    inputWrong: {
        borderColor: '#ef4444',
    },
    feedbackIcon: {
        marginLeft: 12,
    },
    submitButton: {
        height: 56,
        backgroundColor: '#7c3aed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    correctAnswerContainer: {
        padding: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    correctAnswerLabel: {
        color: '#6ee7b7',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    correctAnswerText: {
        color: '#10b981',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
