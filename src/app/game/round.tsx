import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { Timer } from "../../components/ui/Timer";
import { QuestionCard } from "../../components/game/QuestionCard";
import { Confetti } from "../../components/ui/Confetti";
import { MotiView, AnimatePresence } from "moti";
import { generateQuestion, Question, RoundType } from "../../services/gemini/gemini";
import { isFuzzyMatch } from "../../utils/answerMatching";
import { DifficultySlider } from "../../components/ui/DifficultySlider";
import { Sparkles, XCircle, Trophy, Flame, ArrowLeft, Clock } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";

const THEMES: Record<string, { bg: string; accent: string }> = {
    "Science": { bg: "#0c4a6e", accent: "#0ea5e9" },
    "Tech": { bg: "#0c4a6e", accent: "#0ea5e9" },
    "History": { bg: "#451a03", accent: "#f59e0b" },
    "Gaming": { bg: "#4c1d95", accent: "#ec4899" },
    "Pop Culture": { bg: "#4c1d95", accent: "#ec4899" },
    "Nature": { bg: "#064e3b", accent: "#10b981" },
    "Animals": { bg: "#064e3b", accent: "#10b981" },
    "Movies": { bg: "#450a0a", accent: "#ef4444" },
    "Art": { bg: "#450a0a", accent: "#ef4444" },
    "Music": { bg: "#1e1b4b", accent: "#8b5cf6" },
    "Sports": { bg: "#431407", accent: "#f97316" },
    "Food": { bg: "#422006", accent: "#eab308" },
    "Travel": { bg: "#172554", accent: "#3b82f6" },
    "General": { bg: "#020617", accent: "#7c3aed" },
    "Default": { bg: "#020617", accent: "#7c3aed" },
};

export default function RoundScreen() {
    const router = useRouter();
    const {
        players, settings, currentPlayerId, gameStats, game, isHost,
        gameSubjects,
        recordAnswer, getNarratorComment, getLeaderboard,
        getDifficultyForPlayer, setDifficultyForPlayer, setSubjectForPlayer,
        updateRoundSubject, markPlayerAnswered, advanceToNextRound,
    } = useGame();

    const [currentRound, setCurrentRound] = useState(1);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [phase, setPhase] = useState<"starting" | "generating" | "question" | "revealing" | "waiting">("starting");
    const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [narratorComment, setNarratorComment] = useState("");
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [roundSubject, setRoundSubject] = useState<string | null>(null);
    const questionStartTime = useRef<number>(0);
    const hasGeneratedForRound = useRef<number>(0);

    // In different_devices mode, each device only plays for its own player
    const isOnline = settings.mode === "different_devices";
    const localPlayer = players.find(p => p.id === currentPlayerId) || players[0];
    const currentPlayer = isOnline ? localPlayer : (players[currentPlayerIndex] || players[0]);
    const playerStats = currentPlayer ? gameStats[currentPlayer.id] : null;

    // Safety: clamp playerIndex to valid range
    useEffect(() => {
        if (!isOnline && currentPlayerIndex >= players.length && players.length > 0) {
            setCurrentPlayerIndex(0);
        }
    }, [currentPlayerIndex, players.length, isOnline]);

    const getTheme = () => {
        if (!currentQuestion?.topic) return THEMES["Default"];
        for (const key in THEMES) {
            if (currentQuestion.topic.includes(key)) return THEMES[key];
        }
        return THEMES["Default"];
    };

    const currentTheme = getTheme();

    const getRoundType = (roundNum: number): RoundType => {
        const types: RoundType[] = ["multiple_choice", "true_false", "complete_phrase", "multiple_choice", "estimation"];
        return types[(roundNum - 1) % types.length];
    };

    const currentRoundType = getRoundType(currentRound);

    // Pick a random subject from the game-wide subjects
    const pickRandomSubject = useCallback(() => {
        if (!gameSubjects || gameSubjects.length === 0) return "General Knowledge";
        return gameSubjects[Math.floor(Math.random() * gameSubjects.length)];
    }, [gameSubjects]);

    // For online mode: Host picks subject for the round and broadcasts it
    // Non-host waits for the subject from the game record, then generates their own question
    useEffect(() => {
        if (!isOnline || !game) return;

        if (isHost && phase === "starting" && hasGeneratedForRound.current !== currentRound) {
            // Host picks the round subject and broadcasts it
            const subject = pickRandomSubject();
            setRoundSubject(subject);
            updateRoundSubject(subject, currentRound);
            hasGeneratedForRound.current = currentRound;
        }
    }, [isOnline, isHost, game, phase, currentRound, pickRandomSubject]);

    // Non-host: watch for the host's subject broadcast
    useEffect(() => {
        if (!isOnline || isHost || !game) return;

        if (game.current_round_subject && game.current_round_number === currentRound && phase === "starting") {
            setRoundSubject(game.current_round_subject);
        }
    }, [isOnline, isHost, game?.current_round_subject, game?.current_round_number, currentRound, phase]);

    // Online: when all players have answered, host advances to next round
    useEffect(() => {
        if (!isOnline || !isHost || !game || phase !== "waiting") return;

        const answeredCount = game.players_answered?.length || 0;
        const totalPlayers = players.length;

        if (answeredCount >= totalPlayers) {
            // Small delay to ensure UI updates are visible
            setTimeout(() => {
                if (currentRound < settings.totalRounds) {
                    const nextRound = currentRound + 1;
                    advanceToNextRound(nextRound);
                    setCurrentRound(nextRound);
                    setPhase("starting");
                    setSelectedOption(undefined);
                    setCurrentQuestion(null);
                    setCountdown(3);
                    setPointsEarned(0);
                    setRoundSubject(null);
                } else {
                    router.push("/game/results");
                }
            }, 1500);
        }
    }, [isOnline, isHost, game?.players_answered, players.length, phase, currentRound, settings.totalRounds]);

    // Non-host: watch for host advancing the round or game finishing
    useEffect(() => {
        if (!isOnline || isHost || !game) return;

        // Game finished — go to results
        if (game.status === "finished") {
            router.push("/game/results");
            return;
        }

        if (game.current_round_number > currentRound && phase === "waiting") {
            setCurrentRound(game.current_round_number);
            setPhase("starting");
            setSelectedOption(undefined);
            setCurrentQuestion(null);
            setCountdown(3);
            setPointsEarned(0);
            setRoundSubject(null);
        }
    }, [isOnline, isHost, game?.current_round_number, game?.status, currentRound, phase]);

    // Generate a question for the current player with the round's subject
    const generateNextQuestion = async (subjectOverride?: string) => {
        if (!currentPlayer) return;
        const subject = subjectOverride || roundSubject || pickRandomSubject();
        setSubjectForPlayer(currentPlayer.id, subject);
        setPhase("generating");
        setGenerationError(null);

        try {
            const difficulty = getDifficultyForPlayer(currentPlayer.id);
            const question = await generateQuestion(
                currentPlayer,
                currentRoundType,
                [],
                difficulty,
                subject,
            );
            setCurrentQuestion(question);
            setPhase("question");
            questionStartTime.current = Date.now();
        } catch (error: any) {
            setGenerationError(error?.message || "Failed to generate AI question.");
        }
    };

    // Countdown effect — after countdown, auto-generate question
    // For online mode, wait until roundSubject is set before generating
    useEffect(() => {
        if (phase === "starting") {
            // For online non-host, wait for subject from host
            if (isOnline && !isHost && !roundSubject) return;

            // For same_device, pick subject on the fly
            const subjectForRound = isOnline ? roundSubject : pickRandomSubject();
            if (!isOnline) setRoundSubject(subjectForRound);

            GameHaptics.countdown();
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        generateNextQuestion(subjectForRound || undefined);
                        return 3;
                    }
                    GameHaptics.countdown();
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [phase, currentPlayerIndex, currentRound, roundSubject, isOnline, isHost]);

    const handleTimerExpire = useCallback(() => {
        if (phase === "question") {
            recordAnswer(currentPlayer.id, false, currentQuestion?.topic || "General");
            // Online: mark player as answered even on timeout
            if (isOnline && currentPlayerId) {
                markPlayerAnswered(currentPlayerId);
            }
            const comment = getNarratorComment(false, 0, currentPlayer.name);
            setNarratorComment(comment);
            GameHaptics.wrong();
            setPhase("revealing");
        }
    }, [phase, currentPlayer, currentQuestion, isOnline, currentPlayerId]);

    const handleSelect = (option: string) => {
        if (phase !== "question") return;
        const answerTime = Date.now() - questionStartTime.current;
        setSelectedOption(option);

        let isCorrect: boolean;
        if (currentRoundType === "complete_phrase" || currentRoundType === "estimation") {
            isCorrect = isFuzzyMatch(option, currentQuestion?.correctAnswer || "", currentQuestion?.acceptableAnswers || []);
        } else {
            isCorrect = option === currentQuestion?.correctAnswer;
        }

        recordAnswer(currentPlayer.id, isCorrect, currentQuestion?.topic || "General", answerTime);

        // Online: mark this player as having answered
        if (isOnline && currentPlayerId) {
            markPlayerAnswered(currentPlayerId);
        }

        const newStreak = isCorrect ? (playerStats?.streak || 0) + 1 : 0;
        const streakMultiplier = newStreak >= 5 ? 2.5 : newStreak >= 3 ? 2 : newStreak >= 2 ? 1.5 : 1;
        const points = isCorrect ? Math.round(10 * streakMultiplier) : 0;
        setPointsEarned(points);

        const comment = getNarratorComment(isCorrect, newStreak, currentPlayer.name);
        setNarratorComment(comment);

        if (isCorrect) {
            GameHaptics.correct();
            setShowConfetti(true);
            if (newStreak >= 2) GameHaptics.streak();
            setTimeout(() => setShowConfetti(false), 2000);
        } else {
            GameHaptics.wrong();
        }

        setPhase("revealing");
    };

    const handleNext = () => {
        if (showScoreboard) {
            setShowScoreboard(false);
            advanceToNext();
            return;
        }
        advanceToNext();
    };

    const handleViewScores = () => {
        setShowScoreboard(true);
    };

    const advanceToNext = () => {
        if (isOnline) {
            // Online: go to waiting phase until all players have answered
            // The useEffect watching players_answered will handle advancing
            setPhase("waiting");
        } else {
            // Same device: cycle through players, then advance round
            if (currentPlayerIndex < players.length - 1) {
                setCurrentPlayerIndex(prev => prev + 1);
                setPhase("starting");
                setSelectedOption(undefined);
                setCurrentQuestion(null);
                setCountdown(3);
                setPointsEarned(0);
            } else if (currentRound < settings.totalRounds) {
                setCurrentRound(prev => prev + 1);
                setCurrentPlayerIndex(0);
                setPhase("starting");
                setSelectedOption(undefined);
                setCurrentQuestion(null);
                setCountdown(3);
                setPointsEarned(0);
                setRoundSubject(null);
            } else {
                router.push("/game/results");
            }
        }
    };

    const handleLeave = () => {
        Alert.alert("Leave Game", "Are you sure? Your progress will be lost.", [
            { text: "Stay", style: "cancel" },
            { text: "Leave", style: "destructive", onPress: () => router.replace("/") },
        ]);
    };

    // Generating state (after subject pick, before question ready)
    if (phase === "generating") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MotiView
                        from={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1.1, opacity: 1 }}
                        transition={{ type: "timing", duration: 800, loop: true }}
                    >
                        <Sparkles size={64} color="#7c3aed" />
                    </MotiView>
                    <Text style={styles.loadingText}>Generating your question...</Text>
                    <Text style={styles.loadingSubtext}>Round {currentRound} of {settings.totalRounds}</Text>
                    <ActivityIndicator size="large" color="#7c3aed" style={styles.spinner} />
                </View>
            </SafeAreaView>
        );
    }

    // Error from generation with retry
    if (generationError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MotiView from={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <XCircle size={64} color="#ef4444" />
                    </MotiView>
                    <Text style={styles.errorTitle}>AI Generation Failed</Text>
                    <Text style={styles.errorText}>{generationError}</Text>
                    <TouchableOpacity onPress={() => { setGenerationError(null); generateNextQuestion(); }} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back to Lobby</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Waiting for others (online multiplayer)
    if (phase === "waiting") {
        const answeredCount = game?.players_answered?.length || 0;
        const totalPlayers = players.length;
        const waitingFor = players.filter(p => !(game?.players_answered || []).includes(p.id));

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MotiView
                        from={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1.1, opacity: 1 }}
                        transition={{ type: "timing", duration: 1200, loop: true }}
                    >
                        <Clock size={64} color="#7c3aed" />
                    </MotiView>
                    <Text style={styles.loadingText}>Waiting for others...</Text>
                    <Text style={styles.loadingSubtext}>
                        {answeredCount}/{totalPlayers} players answered
                    </Text>
                    {waitingFor.length > 0 && (
                        <View style={styles.waitingPlayersContainer}>
                            {waitingFor.map(p => (
                                <View key={p.id} style={styles.waitingPlayerChip}>
                                    <Text style={styles.waitingPlayerEmoji}>{p.avatar_emoji}</Text>
                                    <Text style={styles.waitingPlayerName}>{p.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    <ActivityIndicator size="large" color="#7c3aed" style={styles.spinner} />
                    {isHost && answeredCount >= totalPlayers && (
                        <Text style={styles.waitingAutoAdvance}>Advancing to next round...</Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    const leaderboard = getLeaderboard();
    const playerDifficulty = currentPlayer ? getDifficultyForPlayer(currentPlayer.id) : 5;

    // Guard: no players available
    if (!currentPlayer) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading players...</Text>
                    <ActivityIndicator size="large" color="#7c3aed" style={styles.spinner} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <MotiView
            from={{ backgroundColor: '#020617' }}
            animate={{ backgroundColor: currentTheme.bg }}
            transition={{ type: "timing", duration: 1000 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <Confetti active={showConfetti} />

                {/* Top bar */}
                <View style={styles.topBarContainer}>
                    <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
                        <ArrowLeft size={18} color="#94a3b8" />
                    </TouchableOpacity>
                    <View style={styles.topBarInfo}>
                        <Text style={styles.roundLabel}>ROUND {currentRound}/{settings.totalRounds}</Text>
                        <Text style={styles.topicLabel}>
                            {currentQuestion?.topic || "General Knowledge"}
                        </Text>
                    </View>
                    <View style={styles.topBarRight}>
                        {phase === "question" && <Timer duration={20} onExpire={handleTimerExpire} isActive={true} />}
                    </View>
                </View>

                {/* Mini leaderboard */}
                {players.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniLeaderboard} contentContainerStyle={styles.miniLeaderboardContent}>
                        {leaderboard.slice(0, 6).map((p, i) => (
                            <View key={p.id} style={[styles.miniPlayer, p.id === currentPlayer?.id && styles.miniPlayerActive]}>
                                <Text style={styles.miniRank}>#{i + 1}</Text>
                                <Text style={styles.miniEmoji}>{p.avatar_emoji}</Text>
                                <Text style={styles.miniScore}>{gameStats[p.id]?.score || 0}</Text>
                                {(gameStats[p.id]?.streak || 0) >= 2 && <Text style={styles.miniStreak}>🔥{gameStats[p.id]?.streak}</Text>}
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Turn banner - only in local multiplayer */}
                {!isOnline && players.length > 1 && currentPlayer && currentPlayerId && phase !== "starting" && (
                    <MotiView
                        from={{ opacity: 0, translateY: -10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={[styles.turnBanner, styles.yourTurnBanner]}
                    >
                        <Text style={styles.turnBannerText}>🎯 {currentPlayer.name}'s Turn</Text>
                        <Text style={styles.turnBannerSub}>Player {currentPlayerIndex + 1} of {players.length}</Text>
                    </MotiView>
                )}

                <View style={styles.content}>
                    <AnimatePresence>
                        {phase === "starting" ? (
                            <MotiView key="starting" from={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} style={styles.countdownContainer}>
                                <View style={[styles.playerBadge, { borderColor: currentTheme.accent, backgroundColor: `${currentTheme.accent}22` }]}>
                                    <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>{currentPlayer.avatar_emoji || "👤"}</Text></View>
                                    <Text style={[styles.playerBadgeText, { color: currentTheme.accent }]}>{currentPlayer.name}'s Turn</Text>
                                </View>
                                <MotiView key={countdown} from={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
                                    <Text style={[styles.countdownNumber, { color: currentTheme.accent }]}>{countdown}</Text>
                                </MotiView>
                                <Text style={styles.countdownText}>Get Ready!</Text>
                                {(playerStats?.streak || 0) >= 2 && (
                                    <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 300 }} style={styles.streakIndicator}>
                                        <Text style={styles.streakIndicatorText}>🔥 {playerStats?.streak}-Streak Active!</Text>
                                    </MotiView>
                                )}
                            </MotiView>
                        ) : showScoreboard ? (
                            <MotiView key="scoreboard" from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.scoreboardContainer}>
                                <View style={styles.scoreboardHeader}>
                                    <Trophy size={24} color="#f59e0b" />
                                    <Text style={styles.scoreboardTitle}>Standings</Text>
                                </View>
                                {leaderboard.map((p, i) => (
                                    <MotiView key={p.id} from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 100 }}
                                        style={[styles.scoreboardRow, i === 0 && styles.scoreboardRowFirst]}
                                    >
                                        <Text style={[styles.scoreboardRank, i === 0 && styles.scoreboardRankFirst]}>#{i + 1}</Text>
                                        <Text style={styles.scoreboardEmoji}>{p.avatar_emoji}</Text>
                                        <Text style={styles.scoreboardName}>{p.name}</Text>
                                        {(gameStats[p.id]?.streak || 0) >= 2 && <Text style={styles.scoreboardStreak}>🔥{gameStats[p.id]?.streak}</Text>}
                                        <Text style={styles.scoreboardPoints}>{gameStats[p.id]?.score || 0}</Text>
                                    </MotiView>
                                ))}
                                <TouchableOpacity onPress={() => setShowScoreboard(false)} style={[styles.nextButton, { backgroundColor: currentTheme.accent, shadowColor: currentTheme.accent, marginTop: 24 }]}>
                                    <Text style={styles.nextButtonText}>Back to Game</Text>
                                </TouchableOpacity>
                            </MotiView>
                        ) : currentQuestion ? (
                            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                                <MotiView key="game" from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
                                    {(playerStats?.streak || 0) >= 2 && phase === "question" && (
                                        <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                                            style={[styles.streakBadge, { backgroundColor: `${currentTheme.accent}22`, borderColor: `${currentTheme.accent}44` }]}
                                        >
                                            <Flame size={16} color={currentTheme.accent} />
                                            <Text style={[styles.streakBadgeText, { color: currentTheme.accent }]}>
                                                {playerStats?.streak}-Streak! {(playerStats?.streak || 0) >= 3 ? "2x" : "1.5x"} Points
                                            </Text>
                                        </MotiView>
                                    )}

                                    {phase === "revealing" && pointsEarned > 0 && (
                                        <MotiView from={{ opacity: 1, translateY: 0, scale: 0.5 }} animate={{ opacity: 0, translateY: -60, scale: 1.3 }}
                                            transition={{ type: "timing", duration: 1500 }} style={styles.floatingPoints}
                                        >
                                            <Text style={[styles.floatingPointsText, { color: currentTheme.accent }]}>+{pointsEarned}</Text>
                                        </MotiView>
                                    )}

                                    <QuestionCard
                                        player={currentPlayer}
                                        question={currentQuestion.question}
                                        options={currentQuestion.options || []}
                                        onSelect={handleSelect}
                                        selectedOption={selectedOption}
                                        isRevealing={phase === "revealing"}
                                        correctAnswer={currentQuestion.correctAnswer}
                                        acceptableAnswers={currentQuestion.acceptableAnswers}
                                        accentColor={currentTheme.accent}
                                        questionType={currentRoundType}
                                        difficulty={playerDifficulty}
                                    />

                                    {phase === "revealing" && narratorComment && (
                                        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
                                            style={[styles.narratorBottomContainer, { backgroundColor: `${currentTheme.accent}18`, borderColor: `${currentTheme.accent}33` }]}
                                        >
                                            <Text style={[styles.narratorBottomText, { color: currentTheme.accent }]}>{narratorComment}</Text>
                                        </MotiView>
                                    )}

                                    {phase === "revealing" && (
                                        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
                                            transition={{ delay: 200 }}
                                            style={styles.difficultyAdjustContainer}
                                        >
                                            <Text style={styles.difficultyAdjustLabel}>Adjust difficulty for next question</Text>
                                            <DifficultySlider
                                                value={playerDifficulty}
                                                onChange={(level) => setDifficultyForPlayer(currentPlayer.id, level)}
                                                accentColor={currentTheme.accent}
                                            />
                                        </MotiView>
                                    )}

                                    {phase === "revealing" && (
                                        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={styles.nextButtonContainer}>
                                            <TouchableOpacity onPress={handleNext}
                                                style={[styles.nextButton, { backgroundColor: currentTheme.accent, shadowColor: currentTheme.accent }]}
                                            >
                                                <Text style={styles.nextButtonText}>
                                                    {isOnline
                                                        ? "Continue"
                                                        : (currentPlayerIndex < players.length - 1 ? "Next Player" :
                                                            currentRound < settings.totalRounds ? "Next Round" : "See Results")}
                                                </Text>
                                            </TouchableOpacity>
                                            {players.length > 1 && (
                                                <TouchableOpacity onPress={handleViewScores} style={styles.viewScoresButton}>
                                                    <Trophy size={16} color="#94a3b8" />
                                                    <Text style={styles.viewScoresText}>View Scores</Text>
                                                </TouchableOpacity>
                                            )}
                                        </MotiView>
                                    )}
                                </MotiView>
                            </ScrollView>
                        ) : null}
                    </AnimatePresence>
                </View>
            </SafeAreaView>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    content: { flex: 1, paddingHorizontal: 20 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 24 },
    loadingSubtext: { color: '#94a3b8', fontSize: 16, marginTop: 8 },
    spinner: { marginTop: 24 },
    topBarContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { padding: 8, marginRight: 8 },
    topBarInfo: { flex: 1 },
    topBarRight: { width: 70, alignItems: 'flex-end' },
    roundLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    topicLabel: { color: 'white', fontWeight: 'bold', fontSize: 16, marginTop: 2 },
    miniLeaderboard: { maxHeight: 44, marginHorizontal: 20, marginBottom: 8 },
    miniLeaderboardContent: { gap: 8 },
    miniPlayer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    miniPlayerActive: { backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
    miniRank: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
    miniEmoji: { fontSize: 16 },
    miniScore: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    miniStreak: { fontSize: 11 },
    turnBanner: { paddingVertical: 8, paddingHorizontal: 24, alignItems: 'center' },
    yourTurnBanner: { backgroundColor: 'rgba(16,185,129,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.3)' },
    turnBannerText: { color: 'white', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
    turnBannerSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
    countdownContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playerBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 2, marginBottom: 32 },
    playerBadgeText: { fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
    countdownNumber: { fontSize: 96, fontWeight: '900' },
    countdownText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
    avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    avatarEmoji: { fontSize: 24 },
    streakIndicator: { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
    streakIndicatorText: { color: 'white', fontSize: 14, fontWeight: '600' },
    streakBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
    streakBadgeText: { fontSize: 13, fontWeight: 'bold' },
    narratorBottomContainer: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    narratorBottomText: { fontSize: 16, fontWeight: '800', fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
    floatingPoints: { position: 'absolute', alignSelf: 'center', top: 60, zIndex: 100 },
    floatingPointsText: { fontSize: 36, fontWeight: '900' },
    difficultyAdjustContainer: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    difficultyAdjustLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
    nextButtonContainer: { marginTop: 20, gap: 12 },
    nextButton: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    nextButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
    viewScoresButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    viewScoresText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
    scoreboardContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
    scoreboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
    scoreboardTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    scoreboardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', padding: 14, borderRadius: 14, marginBottom: 8 },
    scoreboardRowFirst: { backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
    scoreboardRank: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', width: 28 },
    scoreboardRankFirst: { color: '#f59e0b' },
    scoreboardEmoji: { fontSize: 20 },
    scoreboardName: { flex: 1, color: 'white', fontSize: 16, fontWeight: '600' },
    scoreboardStreak: { fontSize: 13 },
    scoreboardPoints: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    errorTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
    errorText: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 32, paddingHorizontal: 32, lineHeight: 24 },
    retryButton: { backgroundColor: '#7c3aed', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
    retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    backButton: { backgroundColor: '#1e293b', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
    backButtonText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
    // Waiting for others styles
    waitingPlayersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20, paddingHorizontal: 32 },
    waitingPlayerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
    waitingPlayerEmoji: { fontSize: 18 },
    waitingPlayerName: { color: '#c4b5fd', fontSize: 14, fontWeight: '600' },
    waitingAutoAdvance: { color: '#10b981', fontSize: 14, fontWeight: '600', marginTop: 16 },
});
