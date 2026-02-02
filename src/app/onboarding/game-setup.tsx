import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { NarratorStyle } from "../../context/GameContext";
import { MotiView } from "moti";
import { Users, User, CheckCircle2, Mic, Smile, GraduationCap, Monitor, Wifi, Minus, Plus } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";
import { DifficultySlider } from "../../components/ui/DifficultySlider";
import { SUBJECTS, isPredefinedSubject } from "../../constants/subjects";
import { CustomSubjectInput, CustomSubjectChip } from "../../components/ui/CustomSubjectInput";

const ROUND_OPTIONS = [3, 5, 7];
const EMOJIS = ["🐶", "🐱", "🦊", "🐻", "🐨", "🐯", "🦁", "🐼", "🐵", "🐸", "🦉", "🦄", "🦖", "🐙", "🍕", "🎮", "🎸", "🚀"];

const NARRATOR_STYLES: { key: NarratorStyle; label: string; desc: string; icon: any; color: string }[] = [
    { key: "game_show", label: "Game Show Host", desc: "Energetic and dramatic", icon: Mic, color: "#f59e0b" },
    { key: "sarcastic", label: "Sarcastic Professor", desc: "Witty and dry humor", icon: GraduationCap, color: "#ef4444" },
    { key: "encouraging", label: "Encouraging Coach", desc: "Supportive and warm", icon: Smile, color: "#10b981" },
];

export default function GameSetupScreen() {
    const router = useRouter();
    const { createGame, createLocalGame, savedProfile, setSelectedSubjectsForPlayer, currentPlayerId } = useGame();
    const [rounds, setRounds] = useState(5);
    const [playerCount, setPlayerCount] = useState(1);
    const [deviceMode, setDeviceMode] = useState<"same_device" | "different_devices">("same_device");
    const [hostName, setHostName] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState("🐶");
    const [narratorStyle, setNarratorStyle] = useState<NarratorStyle>("game_show");
    const [loading, setLoading] = useState(false);
    const [ageType, setAgeType] = useState<"adult" | "child">("adult");
    const [childAge, setChildAge] = useState("");
    const [difficultyLevel, setDifficultyLevel] = useState(5);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    // Pre-fill from saved profile
    useEffect(() => {
        if (savedProfile) {
            setHostName(savedProfile.name);
            setSelectedEmoji(savedProfile.avatar);
        }
    }, [savedProfile]);

    const toggleSubject = (subjectName: string) => {
        GameHaptics.select();
        setSelectedSubjects(prev => {
            if (prev.includes(subjectName)) {
                return prev.filter(s => s !== subjectName);
            }
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

    const [allSubjectsMode, setAllSubjectsMode] = useState(false);

    const effectiveSubjects = allSubjectsMode
        ? SUBJECTS.filter(s => s.name !== "General Knowledge").map(s => s.name)
        : selectedSubjects;

    const handleToggleAllSubjects = () => {
        GameHaptics.select();
        setAllSubjectsMode(prev => !prev);
    };

    const handleStartGame = async () => {
        if (!hostName.trim()) return;
        if (ageType === "child" && !childAge.trim()) return;
        if (!allSubjectsMode && selectedSubjects.length < 3) return;
        setLoading(true);
        try {
            const playerAge = ageType === "adult" ? 30 : parseInt(childAge) || 10;

            if (playerCount === 1) {
                createLocalGame(hostName, selectedEmoji, "General Knowledge", rounds, narratorStyle, playerAge, 1, difficultyLevel, effectiveSubjects);
                router.push("/game/round");
            } else if (deviceMode === "same_device") {
                createLocalGame(hostName, selectedEmoji, "General Knowledge", rounds, narratorStyle, playerAge, playerCount, difficultyLevel, effectiveSubjects);
                router.push("/game/lobby");
            } else {
                await createGame(hostName, selectedEmoji, "General Knowledge", rounds, "different_devices", narratorStyle, playerAge, effectiveSubjects);
                router.push("/game/lobby");
            }
        } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to create game. Please try again.");
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
                    <Text style={styles.title}>Game Setup</Text>
                    <Text style={styles.subtitle}>Customize your TriviAll experience.</Text>
                </MotiView>

                {/* Host Name */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Name</Text>
                    <View style={styles.inputContainer}>
                        <User size={24} color="#94a3b8" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            value={hostName}
                            onChangeText={setHostName}
                            placeholder="Enter your name"
                            placeholderTextColor="#475569"
                        />
                    </View>
                </View>

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
                                    style={styles.input}
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

                {/* Avatar Selection with preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose your Avatar</Text>
                    <View style={styles.avatarPreview}>
                        <MotiView
                            key={selectedEmoji}
                            from={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 10 }}
                            style={styles.previewCircle}
                        >
                            <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                        </MotiView>
                        {hostName ? (
                            <Text style={styles.previewName}>{hostName}</Text>
                        ) : null}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarScroll}>
                        {EMOJIS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                onPress={() => { setSelectedEmoji(emoji); GameHaptics.select(); }}
                                style={[styles.emojiOption, selectedEmoji === emoji && styles.emojiSelected]}
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
                    <Text style={styles.sectionTitle}>Game Subjects</Text>
                    <Text style={styles.sectionSubtitle}>
                        {playerCount > 1 ? "Choose subjects for all players" : "Choose subjects you'd like to be quizzed on"}
                    </Text>
                    <TouchableOpacity
                        onPress={handleToggleAllSubjects}
                        activeOpacity={0.7}
                        style={[styles.allSubjectsToggle, allSubjectsMode && styles.allSubjectsToggleActive]}
                    >
                        <Text style={styles.allSubjectsEmoji}>🌍</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.allSubjectsText, allSubjectsMode && styles.allSubjectsTextActive]}>All Subjects</Text>
                            <Text style={styles.allSubjectsDesc}>Random mix from every category</Text>
                        </View>
                        {allSubjectsMode && <CheckCircle2 size={22} color="#10b981" />}
                    </TouchableOpacity>
                    {!allSubjectsMode && (
                        <Text style={[styles.sectionSubtitle, { marginTop: 16, marginBottom: 12 }]}>
                            Or pick 3-6 specific subjects ({selectedSubjects.length}/6)
                        </Text>
                    )}
                    {!allSubjectsMode && (
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
                    )}

                    {/* Custom subjects */}
                    {!allSubjectsMode && (
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
                    )}
                </View>

                {/* Rounds */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How many rounds?</Text>
                    <View style={styles.roundOptions}>
                        {ROUND_OPTIONS.map((val) => (
                            <TouchableOpacity
                                key={val}
                                onPress={() => { setRounds(val); GameHaptics.select(); }}
                                activeOpacity={0.7}
                                style={[styles.roundOption, rounds === val && styles.roundOptionSelected]}
                            >
                                <Text style={[styles.roundOptionText, rounds === val && styles.roundOptionTextSelected]}>{val}</Text>
                                <Text style={[styles.roundOptionLabel, rounds === val && styles.roundOptionLabelSelected]}>
                                    {val === 3 ? "Quick" : val === 5 ? "Classic" : "Epic"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Player Count */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How many players?</Text>
                    <View style={styles.playerCountStepper}>
                        <TouchableOpacity
                            onPress={() => { setPlayerCount(prev => Math.max(1, prev - 1)); GameHaptics.select(); }}
                            disabled={playerCount <= 1}
                            style={[styles.stepperButton, playerCount <= 1 && styles.stepperButtonDisabled]}
                        >
                            <Minus size={24} color={playerCount <= 1 ? "#475569" : "white"} />
                        </TouchableOpacity>
                        <View style={styles.stepperDisplay}>
                            <Text style={styles.stepperNumber}>{playerCount}</Text>
                            <Text style={styles.stepperLabel}>
                                {playerCount === 1 ? "Solo" : playerCount === 2 ? "Duo" : playerCount === 3 ? "Trio" : playerCount === 4 ? "Squad" : `${playerCount} Players`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => { setPlayerCount(prev => prev + 1); GameHaptics.select(); }}
                            style={styles.stepperButton}
                        >
                            <Plus size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Device Mode - only show when more than 1 player */}
                {playerCount > 1 && (
                    <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ type: "timing", duration: 250 }}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How are you playing?</Text>
                            <View style={styles.modeOptions}>
                                <TouchableOpacity
                                    onPress={() => { setDeviceMode("same_device"); GameHaptics.select(); }}
                                    activeOpacity={0.7}
                                    style={[styles.modeOption, deviceMode === "same_device" && styles.modeOptionSelectedViolet]}
                                >
                                    <View style={[styles.modeIcon, deviceMode === "same_device" ? styles.modeIconViolet : styles.modeIconDefault]}>
                                        <Monitor size={24} color="white" />
                                    </View>
                                    <View style={styles.modeContent}>
                                        <Text style={styles.modeTitle}>Same Device</Text>
                                        <Text style={styles.modeDescription}>Pass and play on this phone</Text>
                                    </View>
                                    {deviceMode === "same_device" && <CheckCircle2 size={24} color="#8b5cf6" />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => { setDeviceMode("different_devices"); GameHaptics.select(); }}
                                    activeOpacity={0.7}
                                    style={[styles.modeOption, deviceMode === "different_devices" && styles.modeOptionSelectedEmerald]}
                                >
                                    <View style={[styles.modeIcon, deviceMode === "different_devices" ? styles.modeIconEmerald : styles.modeIconDefault]}>
                                        <Wifi size={24} color="white" />
                                    </View>
                                    <View style={styles.modeContent}>
                                        <Text style={styles.modeTitle}>Different Devices</Text>
                                        <Text style={styles.modeDescription}>Friends join with a room code</Text>
                                    </View>
                                    {deviceMode === "different_devices" && <CheckCircle2 size={24} color="#10b981" />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* Narrator Style */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Narrator Style</Text>
                    <Text style={styles.sectionSubtitle}>Choose the personality of your game narrator.</Text>
                    <View style={styles.modeOptions}>
                        {NARRATOR_STYLES.map((ns) => {
                            const Icon = ns.icon;
                            const isSelected = narratorStyle === ns.key;
                            return (
                                <TouchableOpacity
                                    key={ns.key}
                                    onPress={() => { setNarratorStyle(ns.key); GameHaptics.select(); }}
                                    activeOpacity={0.7}
                                    style={[styles.modeOption, isSelected && { backgroundColor: `${ns.color}15`, borderColor: `${ns.color}66` }]}
                                >
                                    <View style={[styles.modeIcon, { backgroundColor: isSelected ? ns.color : '#1e293b' }]}>
                                        <Icon size={24} color="white" />
                                    </View>
                                    <View style={styles.modeContent}>
                                        <Text style={styles.modeTitle}>{ns.label}</Text>
                                        <Text style={styles.modeDescription}>{ns.desc}</Text>
                                    </View>
                                    {isSelected && <CheckCircle2 size={24} color={ns.color} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Create */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={handleStartGame}
                        disabled={!hostName.trim() || loading || (!allSubjectsMode && selectedSubjects.length < 3)}
                        style={[styles.startButton, (!hostName.trim() || loading || (!allSubjectsMode && selectedSubjects.length < 3)) && styles.buttonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.startButtonText}>Create Lobby</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 24 },
    header: { marginBottom: 32 },
    title: { fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { color: '#94a3b8', fontSize: 16 },
    section: { marginBottom: 32 },
    sectionTitle: { color: '#cbd5e1', fontWeight: '500', marginBottom: 16, fontSize: 18 },
    sectionSubtitle: { color: '#64748b', fontSize: 14, marginTop: -8, marginBottom: 16 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
        borderWidth: 1, borderColor: '#334155', borderRadius: 12, height: 56, paddingHorizontal: 16,
    },
    icon: { marginRight: 12 },
    input: { flex: 1, color: 'white', fontSize: 18 },
    // Avatar
    avatarPreview: { alignItems: 'center', marginBottom: 16 },
    previewCircle: {
        width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(124, 58, 237, 0.2)',
        borderWidth: 2, borderColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    },
    previewEmoji: { fontSize: 40 },
    previewName: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 8 },
    avatarScroll: { gap: 12, paddingRight: 24 },
    emojiOption: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: '#0f172a',
        borderWidth: 2, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    },
    emojiSelected: { borderColor: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.1)' },
    emojiText: { fontSize: 28 },
    // Player Count Stepper
    playerCountStepper: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20,
    },
    stepperButton: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: '#7c3aed',
        alignItems: 'center', justifyContent: 'center',
    },
    stepperButtonDisabled: { backgroundColor: '#1e293b', opacity: 0.5 },
    stepperDisplay: { alignItems: 'center', minWidth: 100 },
    stepperNumber: { fontSize: 40, fontWeight: '900', color: 'white' },
    stepperLabel: {
        fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 2,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    // Rounds
    roundOptions: { flexDirection: 'row', gap: 16 },
    roundOption: {
        flex: 1, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#1e293b', backgroundColor: '#0f172a',
    },
    roundOptionSelected: {
        backgroundColor: '#7c3aed', borderColor: '#8b5cf6',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    roundOptionText: { fontSize: 24, fontWeight: 'bold', color: '#94a3b8' },
    roundOptionTextSelected: { color: 'white' },
    roundOptionLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    roundOptionLabelSelected: { color: 'rgba(255,255,255,0.7)' },
    // Mode
    modeOptions: { gap: 12 },
    modeOption: {
        padding: 16, borderRadius: 20, borderWidth: 2, borderColor: '#1e293b',
        backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center',
    },
    modeOptionSelectedViolet: { backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: '#8b5cf6' },
    modeOptionSelectedEmerald: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' },
    modeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    modeIconDefault: { backgroundColor: '#1e293b' },
    modeIconViolet: { backgroundColor: '#7c3aed' },
    modeIconEmerald: { backgroundColor: '#10b981' },
    modeContent: { flex: 1 },
    modeTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
    modeDescription: { color: '#94a3b8', fontSize: 13 },
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
    ageInputLabel: { color: '#94a3b8', fontSize: 16, marginRight: 12 },
    // All Subjects Toggle
    allSubjectsToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#1e293b',
        backgroundColor: '#0f172a', marginBottom: 4,
    },
    allSubjectsToggleActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981',
    },
    allSubjectsEmoji: { fontSize: 28 },
    allSubjectsText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
    allSubjectsTextActive: { color: 'white' },
    allSubjectsDesc: { color: '#64748b', fontSize: 13, marginTop: 2 },
    // Subject Selection
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
    // Actions
    actions: { marginTop: 32 },
    startButton: {
        height: 64, backgroundColor: '#7c3aed', borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    },
    buttonDisabled: { backgroundColor: '#475569', opacity: 0.5 },
    startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
