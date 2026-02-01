import React, { useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { MotiView } from "moti";
import { Users, Trash2, Play, Copy, ArrowLeft, Sparkles, UserPlus } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";
import { DifficultySlider } from "../../components/ui/DifficultySlider";
import { SUBJECTS, isPredefinedSubject } from "../../constants/subjects";
import { CustomSubjectInput, CustomSubjectChip } from "../../components/ui/CustomSubjectInput";
import * as Clipboard from "expo-clipboard";

const FUN_FACTS = [
    "Octopuses have three hearts and blue blood!",
    "Honey never spoils. Archaeologists found 3000-year-old edible honey!",
    "A group of flamingos is called a 'flamboyance'.",
    "The shortest war lasted 38-45 minutes (Anglo-Zanzibar War).",
    "Bananas are berries, but strawberries aren't!",
    "Venus is the only planet that spins clockwise.",
    "A jiffy is an actual unit of time: 1/100th of a second.",
    "The Eiffel Tower can grow 6 inches taller in summer heat.",
];

export default function LobbyScreen() {
    const router = useRouter();
    const { players, kickPlayer, settings, game, isHost, startGame, startLocalGame, addLocalPlayer, removeLocalPlayer, updatePlayerStatus, currentPlayerId, gameStats, setSelectedSubjectsForPlayer } = useGame();
    const [isStarting, setIsStarting] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [funFact] = useState(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);

    // Local (same-device) game state
    const isLocalGame = game?.id === "local";
    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState("");
    const [newPlayerEmoji, setNewPlayerEmoji] = useState("🐱");
    const [newPlayerAgeType, setNewPlayerAgeType] = useState<"adult" | "child">("adult");
    const [newPlayerChildAge, setNewPlayerChildAge] = useState("");
    const [newPlayerDifficulty, setNewPlayerDifficulty] = useState(5);
    const [newPlayerSubjects, setNewPlayerSubjects] = useState<string[]>([]);
    const [addPlayerError, setAddPlayerError] = useState("");
    const ADD_PLAYER_EMOJIS = ["🐱", "🦊", "🐻", "🐨", "🐯", "🦁", "🐼", "🐵", "🐸", "🦉", "🦄", "🦖"];

    React.useEffect(() => {
        if (game?.status === 'playing') {
            router.push("/game/round");
        }
    }, [game?.status]);

    const handleStart = async () => {
        if (!isHost) return;
        // Warn if local multiplayer game has only 1 player
        if (isLocalGame && players.length < 2 && settings.playerCount > 1) {
            Alert.alert(
                "No extra players added",
                "You haven't added any other players yet. Start as solo or add players first?",
                [
                    { text: "Add Players", style: "cancel" },
                    { text: "Start Solo", onPress: () => { setIsStarting(true); GameHaptics.countdown(); startLocalGame(); } },
                ]
            );
            return;
        }
        setIsStarting(true);
        GameHaptics.countdown();
        try {
            if (isLocalGame) {
                startLocalGame();
            } else {
                await startGame();
            }
        } catch (error) {
            console.error("Failed to start game:", error);
            setIsStarting(false);
        }
    };

    const newPlayerCustomSubjects = newPlayerSubjects.filter(s => !isPredefinedSubject(s));

    const handleAddNewPlayerCustomSubject = (subject: string) => {
        setNewPlayerSubjects(prev => {
            if (prev.length >= 6) return prev;
            if (prev.some(s => s.toLowerCase() === subject.toLowerCase())) return prev;
            return [...prev, subject];
        });
    };

    const handleRemoveNewPlayerCustomSubject = (subject: string) => {
        GameHaptics.select();
        setNewPlayerSubjects(prev => prev.filter(s => s !== subject));
    };

    const toggleNewPlayerSubject = (subjectName: string) => {
        GameHaptics.select();
        setNewPlayerSubjects(prev => {
            if (prev.includes(subjectName)) return prev.filter(s => s !== subjectName);
            if (prev.length >= 6) return prev;
            return [...prev, subjectName];
        });
    };

    const isAddPlayerValid = () => {
        if (!newPlayerName.trim()) return false;
        if (newPlayerAgeType === "child" && !newPlayerChildAge.trim()) return false;
        if (newPlayerSubjects.length < 3) return false;
        return true;
    };

    const handleAddPlayer = () => {
        setAddPlayerError("");
        if (!newPlayerName.trim()) {
            setAddPlayerError("Please enter a name");
            return;
        }
        if (newPlayerAgeType === "child" && !newPlayerChildAge.trim()) {
            setAddPlayerError("Please enter the child's age");
            return;
        }
        if (newPlayerSubjects.length < 3) {
            setAddPlayerError(`Pick at least 3 subjects (${newPlayerSubjects.length} selected)`);
            return;
        }
        const playerAge = newPlayerAgeType === "adult" ? 30 : parseInt(newPlayerChildAge) || 10;
        const playerId = addLocalPlayer(newPlayerName.trim(), newPlayerEmoji, "General Knowledge", playerAge, newPlayerDifficulty);
        setSelectedSubjectsForPlayer(playerId, newPlayerSubjects);
        setNewPlayerName("");
        setNewPlayerEmoji(ADD_PLAYER_EMOJIS[Math.floor(Math.random() * ADD_PLAYER_EMOJIS.length)]);
        setNewPlayerAgeType("adult");
        setNewPlayerChildAge("");
        setNewPlayerDifficulty(5);
        setNewPlayerSubjects([]);
        setAddPlayerError("");
        setShowAddPlayer(false);
        GameHaptics.correct();
    };

    const handleCopyCode = async () => {
        if (game?.code) {
            await Clipboard.setStringAsync(game.code);
            setCodeCopied(true);
            GameHaptics.correct();
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const handleLeave = () => {
        Alert.alert("Leave Game", "Are you sure you want to leave?", [
            { text: "Stay", style: "cancel" },
            { text: "Leave", style: "destructive", onPress: () => router.replace("/") },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header with back */}
                <MotiView
                    from={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#94a3b8" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Game Lobby</Text>
                        <Text style={styles.subtitle}>Everything is set. Ready to roll?</Text>
                    </View>
                </MotiView>

                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>MODE</Text>
                        <Text style={styles.statValue}>
                            {settings.mode === "same_device" ? "Local" : "Online"}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>ROUNDS</Text>
                        <Text style={styles.statValue}>{settings.totalRounds}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>NARRATOR</Text>
                        <Text style={styles.statValue}>
                            {settings.narratorStyle === "game_show" ? "Show" : settings.narratorStyle === "sarcastic" ? "Snarky" : "Coach"}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>PLAYERS</Text>
                        <Text style={styles.statValue}>{players.length}</Text>
                    </View>
                </View>

                {/* Player list */}
                <ScrollView style={styles.playerList} contentContainerStyle={styles.playerListContent}>
                    <View style={styles.playersContainer}>
                        {players.map((player, index) => (
                            <MotiView
                                key={player.id}
                                from={{ opacity: 0, scale: 0.9, translateX: -20 }}
                                animate={{ opacity: 1, scale: 1, translateX: 0 }}
                                transition={{ delay: index * 100 }}
                                style={[styles.playerCard, player.is_ready && styles.playerCardReady]}
                            >
                                <View style={styles.playerAvatar}>
                                    <Text style={styles.playerAvatarText}>{player.avatar_emoji || "👤"}</Text>
                                </View>
                                <View style={styles.playerInfo}>
                                    <View style={styles.playerNameContainer}>
                                        <Text style={styles.playerName}>{player.name}</Text>
                                        {player.is_host && <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>HOST</Text></View>}
                                        {player.is_ready && <View style={styles.readyBadge}><Text style={styles.readyBadgeText}>READY</Text></View>}
                                    </View>
                                    <Text style={styles.playerMeta}>Difficulty: {gameStats[player.id]?.difficulty || 5}/10</Text>
                                </View>
                                {isHost && !player.is_host && (
                                    <TouchableOpacity onPress={() => isLocalGame ? removeLocalPlayer(player.id) : kickPlayer(player.id)} style={styles.deleteButton}>
                                        <Trash2 size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </MotiView>
                        ))}

                        {/* Same-device: Add Player form */}
                        {isLocalGame && (
                            <View style={styles.addPlayerSection}>
                                {showAddPlayer ? (
                                    <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.addPlayerForm}>
                                        <Text style={styles.addPlayerTitle}>Add Player</Text>
                                        <View style={styles.addPlayerInputRow}>
                                            <TextInput
                                                style={styles.addPlayerInput}
                                                value={newPlayerName}
                                                onChangeText={setNewPlayerName}
                                                placeholder="Player name"
                                                placeholderTextColor="#475569"
                                                autoFocus
                                                returnKeyType="next"
                                            />
                                        </View>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addPlayerEmojiScroll}>
                                            {ADD_PLAYER_EMOJIS.map((emoji) => (
                                                <TouchableOpacity
                                                    key={emoji}
                                                    onPress={() => { setNewPlayerEmoji(emoji); GameHaptics.select(); }}
                                                    style={[styles.addPlayerEmojiOption, newPlayerEmoji === emoji && styles.addPlayerEmojiSelected]}
                                                >
                                                    <Text style={styles.addPlayerEmojiText}>{emoji}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        {/* Age type */}
                                        <View style={styles.addPlayerFieldRow}>
                                            <TouchableOpacity
                                                onPress={() => { setNewPlayerAgeType("adult"); GameHaptics.select(); }}
                                                style={[styles.ageToggle, newPlayerAgeType === "adult" && styles.ageToggleSelected]}
                                            >
                                                <Text style={styles.ageToggleEmoji}>🧑</Text>
                                                <Text style={[styles.ageToggleText, newPlayerAgeType === "adult" && styles.ageToggleTextSelected]}>Adult</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => { setNewPlayerAgeType("child"); GameHaptics.select(); }}
                                                style={[styles.ageToggle, newPlayerAgeType === "child" && styles.ageToggleSelected]}
                                            >
                                                <Text style={styles.ageToggleEmoji}>🧒</Text>
                                                <Text style={[styles.ageToggleText, newPlayerAgeType === "child" && styles.ageToggleTextSelected]}>Child</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {newPlayerAgeType === "child" && (
                                            <View style={styles.addPlayerInputRow}>
                                                <TextInput
                                                    style={styles.addPlayerInput}
                                                    value={newPlayerChildAge}
                                                    onChangeText={(t) => setNewPlayerChildAge(t.replace(/[^0-9]/g, ''))}
                                                    placeholder="Age"
                                                    placeholderTextColor="#475569"
                                                    keyboardType="numeric"
                                                    maxLength={2}
                                                />
                                            </View>
                                        )}
                                        {/* Subjects */}
                                        <View style={styles.addPlayerDifficultyRow}>
                                            <Text style={styles.addPlayerFieldLabel}>Subjects ({newPlayerSubjects.length}/6, min 3)</Text>
                                            <View style={styles.addPlayerSubjectGrid}>
                                                {SUBJECTS.filter(s => s.name !== "General Knowledge").map((subject) => {
                                                    const isSelected = newPlayerSubjects.includes(subject.name);
                                                    const isFull = newPlayerSubjects.length >= 6 && !isSelected;
                                                    return (
                                                        <TouchableOpacity
                                                            key={subject.name}
                                                            onPress={() => toggleNewPlayerSubject(subject.name)}
                                                            disabled={isFull}
                                                            activeOpacity={0.7}
                                                            style={[
                                                                styles.addPlayerSubjectChip,
                                                                isSelected && { backgroundColor: `${subject.color}22`, borderColor: `${subject.color}88` },
                                                                isFull && { opacity: 0.35 },
                                                            ]}
                                                        >
                                                            <Text style={styles.addPlayerSubjectIcon}>{subject.icon}</Text>
                                                            <Text style={[styles.addPlayerSubjectText, isSelected && { color: subject.color }]}>{subject.name}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                            {/* Custom subjects */}
                                            {newPlayerCustomSubjects.length > 0 && (
                                                <View style={styles.addPlayerCustomChipsRow}>
                                                    {newPlayerCustomSubjects.map(s => (
                                                        <CustomSubjectChip key={s} label={s} onRemove={() => handleRemoveNewPlayerCustomSubject(s)} compact />
                                                    ))}
                                                </View>
                                            )}
                                            <CustomSubjectInput
                                                onAdd={handleAddNewPlayerCustomSubject}
                                                existingSubjects={newPlayerSubjects}
                                                maxReached={newPlayerSubjects.length >= 6}
                                                compact
                                            />
                                        </View>
                                        {/* Difficulty */}
                                        <View style={styles.addPlayerDifficultyRow}>
                                            <Text style={styles.addPlayerFieldLabel}>Difficulty</Text>
                                            <DifficultySlider value={newPlayerDifficulty} onChange={setNewPlayerDifficulty} />
                                        </View>
                                        {addPlayerError ? (
                                            <Text style={styles.addPlayerError}>{addPlayerError}</Text>
                                        ) : null}
                                        <View style={styles.addPlayerActions}>
                                            <TouchableOpacity onPress={() => { setShowAddPlayer(false); setAddPlayerError(""); }} style={styles.addPlayerCancel}>
                                                <Text style={styles.addPlayerCancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={handleAddPlayer}
                                                disabled={!isAddPlayerValid()}
                                                style={[styles.addPlayerConfirm, !isAddPlayerValid() && { opacity: 0.4 }]}
                                            >
                                                <Text style={styles.addPlayerConfirmText}>Add {newPlayerEmoji}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </MotiView>
                                ) : (
                                    <TouchableOpacity onPress={() => setShowAddPlayer(true)} style={styles.addPlayerButton}>
                                        <UserPlus size={20} color="#7c3aed" />
                                        <Text style={styles.addPlayerButtonText}>Add Player</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Room code - only for online games */}
                        {!isLocalGame && (
                            <View style={styles.inviteContainer}>
                                <Text style={styles.inviteLabel}>ROOM CODE</Text>
                                <TouchableOpacity onPress={handleCopyCode} style={styles.codeContainer} activeOpacity={0.7}>
                                    <Text style={styles.codeText}>{game?.code || "WAIT"}</Text>
                                    {codeCopied ? (
                                        <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                            <Text style={styles.copiedText}>Copied!</Text>
                                        </MotiView>
                                    ) : (
                                        <Copy size={20} color="#7c3aed" />
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.inviteHint}>Tap to copy and share with friends</Text>
                            </View>
                        )}

                        {/* Fun fact teaser */}
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 600 }}
                            style={styles.factCard}
                        >
                            <View style={styles.factHeader}>
                                <Sparkles size={16} color="#f59e0b" />
                                <Text style={styles.factLabel}>TRIVIA TEASER</Text>
                            </View>
                            <Text style={styles.factText}>{funFact}</Text>
                        </MotiView>
                    </View>
                </ScrollView>

                {/* Actions */}
                <View style={styles.actions}>
                    {isHost ? (
                        <TouchableOpacity
                            onPress={handleStart}
                            disabled={isStarting || (!isLocalGame && players.length < 2)}
                            style={[styles.startButton, (isStarting || (!isLocalGame && players.length < 2)) && styles.startButtonDisabled]}
                        >
                            {!isStarting && <Play size={24} color="white" style={{ marginRight: 8 }} />}
                            <Text style={styles.startButtonText}>
                                {isStarting ? "Initializing..." : (!isLocalGame && players.length < 2) ? "Waiting for players..." : `Start Game (${players.length} player${players.length !== 1 ? "s" : ""})`}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                const isReady = players.find(p => p.id === currentPlayerId)?.is_ready;
                                updatePlayerStatus(!isReady);
                                GameHaptics.select();
                            }}
                            style={[
                                styles.readyButton,
                                players.find(p => p.id === currentPlayerId)?.is_ready && styles.readyButtonActive
                            ]}
                        >
                            <Text style={styles.readyButtonText}>
                                {players.find(p => p.id === currentPlayerId)?.is_ready ? "I'm Ready!" : "Ready Up?"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    content: { flex: 1, padding: 24 },
    header: { marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { padding: 8 },
    title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    subtitle: { color: '#94a3b8', fontSize: 15 },
    statsCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 14, borderRadius: 16,
        borderWidth: 1, borderColor: '#1e293b', marginBottom: 20,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
    statValue: { color: 'white', fontWeight: '600', fontSize: 14 },
    statDivider: { width: 1, height: 32, backgroundColor: '#1e293b' },
    playerList: { flex: 1, marginBottom: 16 },
    playerListContent: { paddingBottom: 16 },
    playersContainer: { gap: 12 },
    playerCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
        padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b',
    },
    playerCardReady: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    playerAvatar: {
        width: 48, height: 48, backgroundColor: '#7c3aed', borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    playerAvatarText: { fontSize: 22 },
    playerInfo: { flex: 1 },
    playerNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    playerName: { color: 'white', fontWeight: 'bold', fontSize: 17 },
    playerMeta: { color: '#94a3b8', fontSize: 13 },
    deleteButton: { padding: 8 },
    hostBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    hostBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    readyBadge: { backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    readyBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    inviteContainer: { alignItems: 'center', marginTop: 8 },
    inviteLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    codeContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
        paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, gap: 12,
    },
    codeText: { color: '#7c3aed', fontWeight: '900', fontSize: 32, letterSpacing: 4 },
    copiedText: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
    inviteHint: { color: '#475569', fontSize: 12, marginTop: 8 },
    factCard: {
        marginTop: 8, padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    factHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    factLabel: { color: '#f59e0b', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
    factText: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
    // Add Player
    addPlayerSection: { marginTop: 4 },
    addPlayerButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        height: 52, borderRadius: 14, borderWidth: 2, borderColor: '#7c3aed', borderStyle: 'dashed',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
    },
    addPlayerButtonText: { color: '#7c3aed', fontSize: 16, fontWeight: '600' },
    addPlayerForm: {
        backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155',
    },
    addPlayerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    addPlayerInputRow: { marginBottom: 12 },
    addPlayerInput: {
        backgroundColor: '#1e293b', borderRadius: 12, height: 48, paddingHorizontal: 14,
        color: 'white', fontSize: 16, borderWidth: 1, borderColor: '#334155',
    },
    addPlayerEmojiScroll: { gap: 8, paddingVertical: 4 },
    addPlayerEmojiOption: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e293b',
        borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center',
    },
    addPlayerEmojiSelected: { borderColor: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.15)' },
    addPlayerEmojiText: { fontSize: 22 },
    addPlayerFieldRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    ageToggle: {
        flex: 1, height: 44, borderRadius: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    },
    ageToggleSelected: { backgroundColor: 'rgba(124, 58, 237, 0.15)', borderColor: '#7c3aed' },
    ageToggleEmoji: { fontSize: 18 },
    ageToggleText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    ageToggleTextSelected: { color: 'white' },
    addPlayerDifficultyRow: { marginTop: 12 },
    addPlayerFieldLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    addPlayerSubjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    addPlayerSubjectChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
        backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    },
    addPlayerSubjectIcon: { fontSize: 14 },
    addPlayerSubjectText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    addPlayerCustomChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 },
    addPlayerError: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
    addPlayerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    addPlayerCancel: {
        flex: 1, height: 44, borderRadius: 12, backgroundColor: '#1e293b',
        alignItems: 'center', justifyContent: 'center',
    },
    addPlayerCancelText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
    addPlayerConfirm: {
        flex: 1, height: 44, borderRadius: 12, backgroundColor: '#7c3aed',
        alignItems: 'center', justifyContent: 'center',
    },
    addPlayerConfirmText: { color: 'white', fontSize: 15, fontWeight: '600' },
    actions: { marginTop: 'auto' },
    startButton: {
        height: 64, backgroundColor: '#10b981', borderRadius: 18, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    },
    startButtonDisabled: { backgroundColor: '#475569', opacity: 0.5 },
    startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    readyButton: {
        height: 64, backgroundColor: '#1e293b', borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#334155',
    },
    readyButtonActive: { backgroundColor: '#10b981', borderColor: '#34d399' },
    readyButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
