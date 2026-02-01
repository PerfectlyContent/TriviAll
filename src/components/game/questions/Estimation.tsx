import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Target, TrendingUp } from "lucide-react-native";

interface EstimationProps {
    player: { name: string; age: number };
    question: string;
    onSubmit: (guess: number) => void;
    submittedGuess?: number;
    isRevealing?: boolean;
    correctAnswer: string;
    allGuesses?: Array<{ playerName: string; guess: number; difference: number }>;
}

export const Estimation = ({
    player,
    question,
    onSubmit,
    submittedGuess,
    isRevealing,
    correctAnswer,
    allGuesses = [],
}: EstimationProps) => {
    const [guess, setGuess] = useState("");

    const handleSubmit = () => {
        const numGuess = parseInt(guess);
        if (!isNaN(numGuess)) {
            onSubmit(numGuess);
        }
    };

    const correctNum = parseInt(correctAnswer);
    const sortedGuesses = [...allGuesses].sort((a, b) => a.difference - b.difference);

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.card}
        >
            <View style={styles.header}>
                <View style={styles.playerInfo}>
                    <View style={styles.avatar}>
                        <Target size={20} color="white" />
                    </View>
                    <View>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerAge}>Estimation Challenge</Text>
                    </View>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>CLOSEST WINS</Text>
                </View>
            </View>

            <Text style={styles.question}>{question}</Text>

            {!isRevealing ? (
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TrendingUp size={20} color="#3b82f6" style={styles.inputIcon} />
                        <TextInput
                            value={guess}
                            onChangeText={setGuess}
                            placeholder="Enter your guess..."
                            placeholderTextColor="#475569"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!guess.trim()}
                        style={[styles.submitButton, !guess.trim() && styles.submitButtonDisabled]}
                    >
                        <Text style={styles.submitButtonText}>Submit Guess</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.resultsContainer}>
                    <View style={styles.correctAnswerBox}>
                        <Text style={styles.correctAnswerLabel}>Correct Answer</Text>
                        <Text style={styles.correctAnswerValue}>{correctAnswer}</Text>
                    </View>

                    {allGuesses.length > 0 && (
                        <View style={styles.guessesContainer}>
                            <Text style={styles.guessesTitle}>All Guesses</Text>
                            {sortedGuesses.map((item, index) => (
                                <MotiView
                                    key={index}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ delay: index * 100 }}
                                    style={[
                                        styles.guessItem,
                                        index === 0 && styles.guessItemWinner
                                    ]}
                                >
                                    <View style={styles.guessRank}>
                                        <Text style={[
                                            styles.guessRankText,
                                            index === 0 && styles.guessRankTextWinner
                                        ]}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.guessInfo}>
                                        <Text style={styles.guessPlayerName}>{item.playerName}</Text>
                                        <Text style={styles.guessValue}>Guessed: {item.guess}</Text>
                                    </View>
                                    <View style={styles.guessDifference}>
                                        <Text style={styles.guessDifferenceText}>
                                            {item.difference === 0 ? "Perfect!" : `±${item.difference}`}
                                        </Text>
                                    </View>
                                </MotiView>
                            ))}
                        </View>
                    )}
                </View>
            )}
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
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    playerAge: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: 'bold',
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
        fontSize: 24,
        fontWeight: 'bold',
    },
    submitButton: {
        height: 56,
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
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
    resultsContainer: {
        gap: 24,
    },
    correctAnswerBox: {
        padding: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        alignItems: 'center',
    },
    correctAnswerLabel: {
        color: '#93c5fd',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    correctAnswerValue: {
        color: '#3b82f6',
        fontSize: 48,
        fontWeight: 'black',
    },
    guessesContainer: {
        gap: 12,
    },
    guessesTitle: {
        color: '#cbd5e1',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    guessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    guessItemWinner: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981',
    },
    guessRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    guessRankText: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 14,
    },
    guessRankTextWinner: {
        color: '#10b981',
    },
    guessInfo: {
        flex: 1,
    },
    guessPlayerName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    guessValue: {
        color: '#94a3b8',
        fontSize: 14,
    },
    guessDifference: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#1e293b',
        borderRadius: 8,
    },
    guessDifferenceText: {
        color: '#cbd5e1',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
