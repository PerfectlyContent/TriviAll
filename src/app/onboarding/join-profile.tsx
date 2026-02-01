import React, { useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGame } from "../../context/GameContext";
import { MotiView } from "moti";
import { CheckCircle2 } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";
import { DifficultySlider } from "../../components/ui/DifficultySlider";
import { SUBJECTS, isPredefinedSubject } from "../../constants/subjects";
import { CustomSubjectInput, CustomSubjectChip } from "../../components/ui/CustomSubjectInput";

const EMOJIS = ["🐶", "🐱", "🦊", "🐻", "🐨", "🐯", "🦁", "🐼", "🐵", "🐸", "🦉", "🦄", "🦖", "🐙", "🍕", "🎮", "🎸", "🚀"];

export default function JoinProfileScreen() {
    const router = useRouter();
    const { code, playerName } = useLocalSearchParams<{ code: string; playerName: string }>();
    const { joinGame, setSelectedSubjectsForPlayer, currentPlayerId } = useGame();

    const [selectedEmoji, setSelectedEmoji] = useState("🐶");
    const [loading, setLoading] = useState(false);
    const [ageType, setAgeType] = useState<"adult" | "child">("adult");
    const [childAge, setChildAge] = useState("");
    const [difficultyLevel, setDifficultyLevel] = useState(5);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const toggleSubject = (subjectName: string) => {
        GameHaptics.select();
        setSelectedSubjects(prev => {
            if (prev.includes(subjectName)) return prev.filter(s => s !== subjectName);
            if (prev.length >= 6) return prev;
            return [...prev, subjectName];
        });
    };

    const customSubjects = selectedSubjects.filter(s => !isPredefinedSubject(s));

    const handleAddCustomSubject = (subject: string) => {
        setSelectedSubjects(prev => {
            if (prev.length >= 6) return prev;
            if (prev.some(s => s.toLowerCase() === subject.toLowerCase())) return prev;
            return [...prev, subject];
        });
    };

    const handleRemoveCustomSubject = (subject: string) => {
        GameHaptics.select();
        setSelectedSubjects(prev => prev.filter(s => s !== subject));
    };

    const handleJoinGame = async () => {
        if (!code || !playerName) {
            console.error("Missing code or playerName");
            return;
        }
        if (ageType === "child" && !childAge.trim()) return;
        if (selectedSubjects.length < 3) return;

        setLoading(true);
        setError(null);
        try {
            const playerAge = ageType === "adult" ? 25 : parseInt(childAge) || 10;
            const playerId = await joinGame(code, playerName, selectedEmoji, "General Knowledge", playerAge);
            setSelectedSubjectsForPlayer(playerId, selectedSubjects);
            router.push("/game/lobby");
        } catch (err: any) {
            const message = err?.message || "Failed to join game. Please check the code and try again.";
            setError(message);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <MotiView
                    from={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.header}
                >
                    <Text style={styles.title}>Create Your Profile</Text>
                    <Text style={styles.subtitle}>Let's personalize your experience, {playerName}!</Text>
                </MotiView>

                {/* Age Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>I am a...</Text>
                    <View style={styles.ageTypeRow}>
                        <TouchableOpacity
                            onPress={() => { setAgeType("adult"); GameHaptics.select(); }}
                            style={[styles.ageTypeOption, ageType === "adult" && styles.ageTypeOptionSelected]}
                        >
                            <Text style={styles.ageTypeEmoji}>🧑</Text>
                            <Text style={[styles.ageTypeText, ageType === "adult" && styles.ageTypeTextSelected]}>Adult</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { setAgeType("child"); GameHaptics.select(); }}
                            style={[styles.ageTypeOption, ageType === "child" && styles.ageTypeOptionSelected]}
                        >
                            <Text style={styles.ageTypeEmoji}>🧒</Text>
                            <Text style={[styles.ageTypeText, ageType === "child" && styles.ageTypeTextSelected]}>Child</Text>
                        </TouchableOpacity>
                    </View>
                    {ageType === "child" && (
                        <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 72 }} transition={{ type: "timing", duration: 200 }}>
                            <View style={[styles.inputContainer, { marginTop: 12 }]}>
                                <Text style={styles.ageInputLabel}>Age</Text>
                                <TextInput
                                    style={styles.ageInput}
                                    value={childAge}
                                    onChangeText={(t) => setChildAge(t.replace(/[^0-9]/g, ''))}
                                    placeholder="How old are you?"
                                    placeholderTextColor="#475569"
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                        </MotiView>
                    )}
                </View>

                {/* Avatar Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose your Avatar</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarScroll}>
                        {EMOJIS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                onPress={() => setSelectedEmoji(emoji)}
                                style={[
                                    styles.emojiOption,
                                    selectedEmoji === emoji && styles.emojiSelected
                                ]}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Difficulty Level */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Difficulty Level</Text>
                    <Text style={styles.sectionSubtitle}>How challenging should your questions be?</Text>
                    <DifficultySlider value={difficultyLevel} onChange={setDifficultyLevel} />
                </View>

                {/* Subject Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pick your Subjects</Text>
                    <Text style={styles.sectionSubtitle}>Choose 3-6 subjects ({selectedSubjects.length}/6)</Text>
                    <View style={styles.subjectGrid}>
                        {SUBJECTS.filter(s => s.name !== "General Knowledge").map((subject) => {
                            const isSelected = selectedSubjects.includes(subject.name);
                            const isFull = selectedSubjects.length >= 6 && !isSelected;
                            return (
                                <TouchableOpacity
                                    key={subject.name}
                                    onPress={() => toggleSubject(subject.name)}
                                    disabled={isFull}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.subjectChip,
                                        isSelected && { backgroundColor: `${subject.color}22`, borderColor: `${subject.color}88` },
                                        isFull && { opacity: 0.35 },
                                    ]}
                                >
                                    <Text style={styles.subjectChipIcon}>{subject.icon}</Text>
                                    <Text style={[styles.subjectChipText, isSelected && { color: subject.color }]}>{subject.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Custom subjects */}
                    <View style={styles.customSection}>
                        <Text style={styles.customLabel}>Or add your own:</Text>
                        {customSubjects.length > 0 && (
                            <View style={styles.customChipsRow}>
                                {customSubjects.map(s => (
                                    <CustomSubjectChip key={s} label={s} onRemove={() => handleRemoveCustomSubject(s)} />
                                ))}
                            </View>
                        )}
                        <CustomSubjectInput
                            onAdd={handleAddCustomSubject}
                            existingSubjects={selectedSubjects}
                            maxReached={selectedSubjects.length >= 6}
                        />
                    </View>
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleJoinGame}
                    disabled={loading || selectedSubjects.length < 3}
                    style={[styles.joinButton, (loading || selectedSubjects.length < 3) && styles.joinButtonDisabled]}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <CheckCircle2 size={24} color="white" style={styles.buttonIcon} />
                            <Text style={styles.joinButtonText}>Join Game</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    customSection: { marginTop: 16 },
    customLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 10 },
    customChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    subjectChip: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#1e293b',
    },
    subjectChipIcon: { fontSize: 18 },
    subjectChipText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    avatarScroll: {
        gap: 12,
        paddingVertical: 8,
    },
    emojiOption: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#0f172a',
        borderWidth: 2,
        borderColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiSelected: {
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
    },
    emojiText: {
        fontSize: 32,
    },
    // Age Type
    ageTypeRow: { flexDirection: 'row', gap: 12 },
    ageTypeOption: {
        flex: 1, height: 64, borderRadius: 16, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#1e293b',
    },
    ageTypeOptionSelected: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: '#8b5cf6',
    },
    ageTypeEmoji: { fontSize: 24 },
    ageTypeText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
    ageTypeTextSelected: { color: 'white' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
        borderWidth: 2, borderColor: '#1e293b', borderRadius: 12, height: 56, paddingHorizontal: 16,
    },
    ageInputLabel: { color: '#94a3b8', fontSize: 16, marginRight: 12 },
    ageInput: { flex: 1, color: 'white', fontSize: 18 },
    joinButton: {
        height: 64,
        backgroundColor: '#10b981',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    joinButtonDisabled: {
        opacity: 0.5,
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonIcon: {
        marginRight: 4,
    },
    joinButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
