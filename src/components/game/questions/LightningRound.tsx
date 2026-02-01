import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Zap, CheckCircle2, XCircle } from "lucide-react-native";

interface LightningRoundProps {
    player: { name: string; age: number };
    questions: Array<{
        question: string;
        correctAnswer: string;
        options?: string[];
    }>;
    onComplete: (score: number) => void;
}

export const LightningRound = ({
    player,
    questions,
    onComplete,
}: LightningRoundProps) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>();
    const [isRevealing, setIsRevealing] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const isComplete = currentQuestionIndex >= questions.length || timeLeft <= 0;

    useEffect(() => {
        if (isComplete) {
            onComplete(score);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isComplete, score]);

    const handleAnswer = (answer: string) => {
        setSelectedAnswer(answer);
        setIsRevealing(true);

        const isCorrect = answer === currentQuestion.correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(undefined);
                setIsRevealing(false);
            }
        }, 1000);
    };

    if (isComplete) {
        return (
            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.completeCard}
            >
                <View style={styles.completeIcon}>
                    <Zap size={48} color="white" />
                </View>
                <Text style={styles.completeTitle}>Lightning Round Complete!</Text>
                <Text style={styles.completeScore}>{score} / {questions.length}</Text>
                <Text style={styles.completeSubtext}>Correct Answers</Text>
            </MotiView>
        );
    }

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.card}
        >
            <View style={styles.header}>
                <View style={styles.playerInfo}>
                    <View style={styles.avatar}>
                        <Zap size={20} color="white" />
                    </View>
                    <View>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerAge}>Lightning Round</Text>
                    </View>
                </View>
                <View style={styles.timerBadge}>
                    <Text style={styles.timerText}>{timeLeft}s</Text>
                </View>
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
            </View>

            <Text style={styles.questionNumber}>
                Question {currentQuestionIndex + 1} of {questions.length}
            </Text>

            <Text style={styles.question}>{currentQuestion.question}</Text>

            <View style={styles.options}>
                {currentQuestion.options?.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = isRevealing && option === currentQuestion.correctAnswer;
                    const isWrong = isRevealing && isSelected && option !== currentQuestion.correctAnswer;

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => !isRevealing && handleAnswer(option)}
                            disabled={isRevealing}
                            activeOpacity={0.7}
                            style={[
                                styles.option,
                                isSelected && !isRevealing && styles.optionSelected,
                                isCorrect && styles.optionCorrect,
                                isWrong && styles.optionWrong,
                            ]}
                        >
                            <Text style={[
                                styles.optionText,
                                isSelected && !isRevealing && styles.optionTextSelected,
                                isCorrect && styles.optionTextCorrect,
                                isWrong && styles.optionTextWrong,
                            ]}>
                                {option}
                            </Text>
                            {isCorrect && <CheckCircle2 size={20} color="#10b981" />}
                            {isWrong && <XCircle size={20} color="#ef4444" />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Score:</Text>
                <Text style={styles.scoreValue}>{score}</Text>
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
        marginBottom: 16,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        backgroundColor: '#f59e0b',
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
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: 'bold',
    },
    timerBadge: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    timerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#1e293b',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#f59e0b',
    },
    questionNumber: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    question: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 28,
        marginBottom: 24,
    },
    options: {
        gap: 12,
    },
    option: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#1e293b',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionSelected: {
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    optionCorrect: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    optionWrong: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#cbd5e1',
    },
    optionTextSelected: {
        color: 'white',
    },
    optionTextCorrect: {
        color: '#10b981',
    },
    optionTextWrong: {
        color: '#ef4444',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    scoreLabel: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scoreValue: {
        color: '#f59e0b',
        fontSize: 24,
        fontWeight: 'black',
    },
    completeCard: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 24,
        padding: 48,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    completeIcon: {
        width: 96,
        height: 96,
        backgroundColor: '#f59e0b',
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    completeTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    completeScore: {
        color: '#f59e0b',
        fontSize: 48,
        fontWeight: 'black',
    },
    completeSubtext: {
        color: '#94a3b8',
        fontSize: 16,
        marginTop: 8,
    },
});
