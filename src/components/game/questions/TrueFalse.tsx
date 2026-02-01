import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { CheckCircle2, XCircle } from "lucide-react-native";

interface TrueFalseProps {
    player: { name: string; age: number };
    question: string;
    onSelect: (answer: string) => void;
    selectedOption?: string;
    isRevealing?: boolean;
    correctAnswer: string;
}

export const TrueFalse = ({
    player,
    question,
    onSelect,
    selectedOption,
    isRevealing,
    correctAnswer,
}: TrueFalseProps) => {
    const options = ["True", "False"];

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
                    <Text style={styles.badgeText}>TRUE / FALSE</Text>
                </View>
            </View>

            <Text style={styles.question}>{question}</Text>

            <View style={styles.options}>
                {options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = isRevealing && option === correctAnswer;
                    const isWrong = isRevealing && isSelected && option !== correctAnswer;

                    const containerStyle: any[] = [styles.option];
                    const textStyle: any[] = [styles.optionText];

                    if (isSelected && !isRevealing) {
                        containerStyle.push(styles.optionSelected);
                        textStyle.push(styles.optionTextSelected);
                    }

                    if (isCorrect) {
                        containerStyle.push(styles.optionCorrect);
                        textStyle.push(styles.optionTextCorrect);
                    }

                    if (isWrong) {
                        containerStyle.push(styles.optionWrong);
                        textStyle.push(styles.optionTextWrong);
                    }

                    return (
                        <MotiView
                            key={index}
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 100 }}
                        >
                            <TouchableOpacity
                                onPress={() => !isRevealing && onSelect(option)}
                                disabled={isRevealing}
                                activeOpacity={0.7}
                                style={containerStyle}
                            >
                                <Text style={textStyle}>{option}</Text>
                                {isCorrect && (
                                    <CheckCircle2 size={32} color="#10b981" style={styles.feedbackIcon} />
                                )}
                                {isWrong && (
                                    <XCircle size={32} color="#ef4444" style={styles.feedbackIcon} />
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
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 36,
        marginBottom: 40,
        textAlign: 'center',
    },
    options: {
        gap: 20,
    },
    option: {
        padding: 32,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#1e293b',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    optionSelected: {
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
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
        fontSize: 24,
        fontWeight: 'bold',
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
    feedbackIcon: {
        marginLeft: 8,
    },
});
