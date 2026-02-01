import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useGame, NarratorStyle } from "../../context/GameContext";
import { Confetti } from "../../components/ui/Confetti";
import { MotiView } from "moti";
import { Trophy, Target, Zap, TrendingUp, RotateCcw, Home, Mic } from "lucide-react-native";
import { GameHaptics } from "../../utils/sounds";

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32", "#64748b"];
const RANK_LABELS = ["1st", "2nd", "3rd"];

type SummaryContext = {
    winnerName: string;
    winnerScore: number;
    winnerAccuracy: number;
    winnerStreak: number;
    totalPlayers: number;
    isSolo: boolean;
    loserName?: string;
    loserScore?: number;
    wasClose: boolean;
    totalQuestions: number;
};

const NARRATOR_SUMMARIES: Record<NarratorStyle, (ctx: SummaryContext) => string[]> = {
    game_show: (ctx) => {
        const lines: string[] = [];
        if (ctx.isSolo) {
            lines.push(`What a performance by ${ctx.winnerName}! ${ctx.winnerScore} points and ${ctx.winnerAccuracy}% accuracy!`);
            if (ctx.winnerStreak >= 3) lines.push(`And that ${ctx.winnerStreak}-answer streak? ELECTRIFYING!`);
            if (ctx.winnerAccuracy === 100) lines.push("A PERFECT game! The crowd is on their feet!");
            else if (ctx.winnerAccuracy >= 80) lines.push("An absolutely DOMINANT display of trivia mastery!");
            else lines.push("A solid showing! Come back and try to beat your score!");
        } else {
            lines.push(`Ladies and gentlemen, your champion: ${ctx.winnerName} with ${ctx.winnerScore} points!`);
            if (ctx.wasClose) lines.push("What a nail-biter! That could have gone either way!");
            else lines.push(`${ctx.winnerName} was simply UNSTOPPABLE tonight!`);
            if (ctx.winnerStreak >= 3) lines.push(`That ${ctx.winnerStreak}-answer hot streak sealed the deal!`);
            if (ctx.loserName) lines.push(`Better luck next time, ${ctx.loserName}. The rematch awaits!`);
        }
        return lines;
    },
    sarcastic: (ctx) => {
        const lines: string[] = [];
        if (ctx.isSolo) {
            if (ctx.winnerAccuracy === 100) lines.push(`${ctx.winnerName} got everything right. Suspicious, but I'll allow it.`);
            else if (ctx.winnerAccuracy >= 80) lines.push(`${ctx.winnerAccuracy}% accuracy. Not bad. I've seen better... from Google.`);
            else if (ctx.winnerAccuracy >= 50) lines.push(`${ctx.winnerAccuracy}% accuracy. So you knew about half the answers. Inspiring.`);
            else lines.push(`${ctx.winnerAccuracy}% accuracy. Were the questions in a foreign language, ${ctx.winnerName}?`);
            lines.push(`${ctx.winnerScore} points. I'm sure that's a record... somewhere.`);
        } else {
            lines.push(`Congratulations to ${ctx.winnerName}. ${ctx.winnerScore} points. Try not to let it change you.`);
            if (ctx.wasClose) lines.push(`It was close though. Like, embarrassingly close for the "winner."`);
            else lines.push(`It wasn't even close. ${ctx.loserName || "Everyone else"} might want to read a book before the rematch.`);
            if (ctx.winnerStreak >= 3) lines.push(`${ctx.winnerStreak} in a row? Either ${ctx.winnerName} is a genius or the questions were too easy.`);
        }
        return lines;
    },
    encouraging: (ctx) => {
        const lines: string[] = [];
        if (ctx.isSolo) {
            lines.push(`Amazing effort, ${ctx.winnerName}! ${ctx.winnerScore} points and you should be so proud!`);
            if (ctx.winnerAccuracy >= 80) lines.push(`${ctx.winnerAccuracy}% accuracy is absolutely incredible! You're a trivia star!`);
            else lines.push("Every question is a chance to learn something new, and you did wonderfully!");
            if (ctx.winnerStreak >= 2) lines.push(`That ${ctx.winnerStreak}-answer streak shows real focus and confidence!`);
        } else {
            lines.push(`What an incredible game! Every single player should be proud of how they did!`);
            lines.push(`${ctx.winnerName} takes the crown with ${ctx.winnerScore} points - beautiful!`);
            if (ctx.wasClose) lines.push("It was SO close! That just shows how talented everyone is!");
            if (ctx.loserName) lines.push(`${ctx.loserName}, you played with heart - the next win has your name on it!`);
        }
        return lines;
    },
};

interface Award {
    label: string;
    playerName: string;
    playerEmoji: string;
    value: string;
    icon: any;
    color: string;
}

export default function ResultsScreen() {
    const router = useRouter();
    const { getLeaderboard, gameStats, finalizeGame, resetGame, currentPlayerId, settings, players } = useGame();
    const [showConfetti, setShowConfetti] = useState(false);

    const leaderboard = getLeaderboard();
    const winner = leaderboard.length > 0 ? leaderboard[0] : null;

    useEffect(() => {
        if (winner) {
            setShowConfetti(true);
            GameHaptics.victory();
            finalizeGame(winner.id);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    }, []);

    // Compute awards (only when we have players)
    const awards: Award[] = [];

    if (leaderboard.length > 0) {
        // Best Streak
        let bestStreakPlayer = leaderboard[0];
        for (const p of leaderboard) {
            if ((gameStats[p.id]?.bestStreak || 0) > (gameStats[bestStreakPlayer.id]?.bestStreak || 0)) {
                bestStreakPlayer = p;
            }
        }
        if ((gameStats[bestStreakPlayer?.id]?.bestStreak || 0) >= 2) {
            awards.push({
                label: "Hottest Streak", playerName: bestStreakPlayer.name, playerEmoji: bestStreakPlayer.avatar_emoji,
                value: `${gameStats[bestStreakPlayer.id]?.bestStreak} in a row`, icon: Zap, color: "#f97316",
            });
        }

        // Sharpshooter
        let bestAccPlayer = leaderboard[0];
        let bestAcc = 0;
        for (const p of leaderboard) {
            const stats = gameStats[p.id];
            if (stats && stats.total > 0) {
                const acc = stats.correct / stats.total;
                if (acc > bestAcc) { bestAcc = acc; bestAccPlayer = p; }
            }
        }
        if (bestAcc > 0 && leaderboard.length > 1) {
            awards.push({
                label: "Sharpshooter", playerName: bestAccPlayer.name, playerEmoji: bestAccPlayer.avatar_emoji,
                value: `${Math.round(bestAcc * 100)}% accuracy`, icon: Target, color: "#10b981",
            });
        }

        // Fastest Fingers
        let fastestPlayer = leaderboard[0];
        let fastestTime = Infinity;
        for (const p of leaderboard) {
            const stats = gameStats[p.id];
            if (stats?.fastestAnswer && stats.fastestAnswer < fastestTime) { fastestTime = stats.fastestAnswer; fastestPlayer = p; }
        }
        if (fastestTime < Infinity && leaderboard.length > 1) {
            awards.push({
                label: "Fastest Fingers", playerName: fastestPlayer.name, playerEmoji: fastestPlayer.avatar_emoji,
                value: `${(fastestTime / 1000).toFixed(1)}s answer`, icon: TrendingUp, color: "#3b82f6",
            });
        }
    }

    // Generate narrator summary
    const narratorSummary: string[] = (() => {
        if (!winner) return [];
        const winnerStats = gameStats[winner.id];
        const winnerAcc = winnerStats && winnerStats.total > 0 ? Math.round((winnerStats.correct / winnerStats.total) * 100) : 0;
        const lastPlace = leaderboard.length > 1 ? leaderboard[leaderboard.length - 1] : null;
        const scoreDiff = lastPlace ? (winnerStats?.score || 0) - (gameStats[lastPlace.id]?.score || 0) : 0;

        const ctx: SummaryContext = {
            winnerName: winner.name,
            winnerScore: winnerStats?.score || 0,
            winnerAccuracy: winnerAcc,
            winnerStreak: winnerStats?.bestStreak || 0,
            totalPlayers: leaderboard.length,
            isSolo: leaderboard.length === 1,
            loserName: lastPlace && lastPlace.id !== winner.id ? lastPlace.name : undefined,
            loserScore: lastPlace ? gameStats[lastPlace.id]?.score || 0 : undefined,
            wasClose: leaderboard.length > 1 && scoreDiff <= 15,
            totalQuestions: winnerStats?.total || 0,
        };

        return NARRATOR_SUMMARIES[settings.narratorStyle](ctx);
    })();

    const handleRematch = () => { GameHaptics.tap(); resetGame(); router.replace("/onboarding/game-setup"); };
    const handleHome = () => { GameHaptics.tap(); resetGame(); router.replace("/"); };
    const isWinner = winner != null && winner.id === currentPlayerId;

    // If game state was already cleared (e.g. navigating back), show nothing
    if (leaderboard.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity onPress={() => router.replace("/")} style={styles.homeButton}>
                        <Home size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                        <Text style={styles.homeButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Confetti active={showConfetti} count={50} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <MotiView from={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 12 }} style={styles.header}>
                    <View style={styles.crownContainer}>
                        <MotiView from={{ rotate: "-10deg" }} animate={{ rotate: "10deg" }} transition={{ type: "timing", duration: 1000, loop: true }}>
                            <Text style={styles.crownEmoji}>👑</Text>
                        </MotiView>
                    </View>
                    {winner && (
                        <>
                            <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 300 }} style={styles.winnerAvatar}>
                                <Text style={styles.winnerEmojiText}>{winner.avatar_emoji}</Text>
                            </MotiView>
                            <Text style={styles.winnerName}>{winner.name}</Text>
                            <Text style={styles.winnerLabel}>{isWinner ? "You Won!" : "Winner!"}</Text>
                            <View style={styles.winnerScore}>
                                <Trophy size={20} color="#f59e0b" />
                                <Text style={styles.winnerScoreText}>{gameStats[winner.id]?.score || 0} pts</Text>
                            </View>
                        </>
                    )}
                </MotiView>

                {/* Narrator Summary */}
                {narratorSummary.length > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: 15 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 250 }}
                        style={styles.narratorSummary}
                    >
                        <View style={styles.narratorSummaryHeader}>
                            <Mic size={16} color="#7c3aed" />
                            <Text style={styles.narratorSummaryLabel}>NARRATOR'S TAKE</Text>
                        </View>
                        {narratorSummary.map((line, i) => (
                            <MotiView
                                key={i}
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ delay: 400 + i * 200 }}
                            >
                                <Text style={styles.narratorSummaryText}>"{line}"</Text>
                            </MotiView>
                        ))}
                    </MotiView>
                )}

                {/* Leaderboard */}
                <View style={styles.leaderboardSection}>
                    <Text style={styles.sectionTitle}>FINAL STANDINGS</Text>
                    {leaderboard.map((player, index) => {
                        const stats = gameStats[player.id];
                        const accuracy = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                        const rankColor = RANK_COLORS[index] || RANK_COLORS[3];
                        return (
                            <MotiView key={player.id} from={{ opacity: 0, translateX: -30 }} animate={{ opacity: 1, translateX: 0 }}
                                transition={{ delay: 400 + index * 150 }} style={[styles.playerRow, index === 0 && styles.playerRowFirst]}
                            >
                                <View style={[styles.rankBadge, { backgroundColor: `${rankColor}22`, borderColor: `${rankColor}66` }]}>
                                    <Text style={[styles.rankText, { color: rankColor }]}>{RANK_LABELS[index] || `${index + 1}th`}</Text>
                                </View>
                                <View style={styles.playerAvatar}><Text style={styles.playerAvatarText}>{player.avatar_emoji}</Text></View>
                                <View style={styles.playerDetails}>
                                    <Text style={styles.playerName2}>{player.name}</Text>
                                    <View style={styles.playerMeta}>
                                        <Text style={styles.playerAccuracy}>{accuracy}% accuracy</Text>
                                        {(stats?.bestStreak || 0) >= 2 && <Text style={styles.playerStreak}>🔥 {stats?.bestStreak}</Text>}
                                    </View>
                                </View>
                                <View style={styles.playerScoreContainer}>
                                    <Text style={[styles.playerScore, { color: rankColor }]}>{stats?.score || 0}</Text>
                                    <Text style={styles.playerScoreLabel}>pts</Text>
                                </View>
                            </MotiView>
                        );
                    })}
                </View>

                {/* Awards */}
                {awards.length > 0 && (
                    <View style={styles.awardsSection}>
                        <Text style={styles.sectionTitle}>AWARDS</Text>
                        <View style={styles.awardsGrid}>
                            {awards.map((award, index) => {
                                const AwardIcon = award.icon;
                                return (
                                    <MotiView key={award.label} from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 800 + index * 150 }} style={[styles.awardCard, { borderColor: `${award.color}44` }]}
                                    >
                                        <View style={[styles.awardIcon, { backgroundColor: `${award.color}22` }]}><AwardIcon size={24} color={award.color} /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.awardLabel}>{award.label}</Text>
                                            <Text style={styles.awardPlayer}>{award.playerEmoji} {award.playerName}</Text>
                                        </View>
                                        <Text style={[styles.awardValue, { color: award.color }]}>{award.value}</Text>
                                    </MotiView>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Actions */}
                <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 1200 }} style={styles.actions}>
                    <TouchableOpacity onPress={handleRematch} style={styles.rematchButton}>
                        <RotateCcw size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.rematchButtonText}>Play Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleHome} style={styles.homeButton}>
                        <Home size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                        <Text style={styles.homeButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </MotiView>

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    scrollContent: { padding: 24 },
    header: { alignItems: 'center', marginBottom: 32, paddingTop: 16 },
    crownContainer: { marginBottom: 8 },
    crownEmoji: { fontSize: 48 },
    winnerAvatar: {
        width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(245,158,11,0.2)',
        borderWidth: 3, borderColor: '#f59e0b', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, marginBottom: 12,
    },
    winnerEmojiText: { fontSize: 44 },
    winnerName: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
    winnerLabel: { color: '#f59e0b', fontSize: 16, fontWeight: '600', marginBottom: 8 },
    winnerScore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    winnerScoreText: { color: '#f59e0b', fontSize: 24, fontWeight: 'bold' },
    narratorSummary: {
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.25)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
    },
    narratorSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    narratorSummaryLabel: {
        color: '#7c3aed',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    narratorSummaryText: {
        color: '#e0e7ff',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
        lineHeight: 24,
        marginBottom: 8,
    },
    leaderboardSection: { marginBottom: 28 },
    sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 16 },
    playerRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
        padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b',
    },
    playerRowFirst: { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' },
    rankBadge: { width: 40, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { fontSize: 12, fontWeight: 'bold' },
    playerAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    playerAvatarText: { fontSize: 20 },
    playerDetails: { flex: 1 },
    playerName2: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
    playerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    playerAccuracy: { color: '#94a3b8', fontSize: 13 },
    playerStreak: { fontSize: 12 },
    playerScoreContainer: { alignItems: 'flex-end' },
    playerScore: { fontSize: 22, fontWeight: 'bold' },
    playerScoreLabel: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
    awardsSection: { marginBottom: 28 },
    awardsGrid: { gap: 10 },
    awardCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 14, borderRadius: 14,
        borderWidth: 1, gap: 12,
    },
    awardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    awardLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    awardPlayer: { color: 'white', fontSize: 14, fontWeight: '600' },
    awardValue: { fontSize: 13, fontWeight: 'bold' },
    actions: { gap: 12 },
    rematchButton: {
        height: 60, backgroundColor: '#7c3aed', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    },
    rematchButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    homeButton: {
        height: 56, backgroundColor: '#0f172a', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#1e293b',
    },
    homeButtonText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
});
