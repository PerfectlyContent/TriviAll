import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MotiView } from "moti";
import { ChevronDown, ChevronUp, Repeat, Shuffle, PenLine } from "lucide-react-native";
import { SUBJECTS, Subject, isPredefinedSubject, getSubjectMeta, CUSTOM_SUBJECT_COLOR } from "../../constants/subjects";
import { GameHaptics } from "../../utils/sounds";
import { CustomSubjectInput } from "../ui/CustomSubjectInput";

interface SubjectPickerProps {
    playerName: string;
    playerAvatar: string;
    lastSubject: string | null;
    isAdult: boolean;
    onSubjectSelected: (subject: string) => void;
    allowedSubjects?: string[];
}

export const SubjectPicker = ({
    playerName,
    playerAvatar,
    lastSubject,
    isAdult,
    onSubjectSelected,
    allowedSubjects,
}: SubjectPickerProps) => {
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Split allowed subjects into predefined and custom
    const predefinedAllowed = SUBJECTS.filter(s =>
        !allowedSubjects || allowedSubjects.length === 0 || allowedSubjects.includes(s.name)
    );
    const customAllowed = (allowedSubjects || []).filter(s => !isPredefinedSubject(s));

    const handleSubjectTap = (subject: Subject) => {
        GameHaptics.select();
        if (!isAdult || subject.subTopics.length === 0) {
            onSubjectSelected(subject.name);
            return;
        }
        // Adult: toggle sub-topic expansion
        if (expandedSubject === subject.name) {
            // Second tap on same subject = select the broad category
            onSubjectSelected(subject.name);
        } else {
            setExpandedSubject(subject.name);
        }
    };

    const handleSubTopicTap = (subTopic: string) => {
        GameHaptics.select();
        onSubjectSelected(subTopic);
    };

    const handleStick = () => {
        GameHaptics.select();
        if (lastSubject) onSubjectSelected(lastSubject);
    };

    const handleCustomSubjectTap = (subjectName: string) => {
        GameHaptics.select();
        onSubjectSelected(subjectName);
    };

    const handleTryNew = (subject: string) => {
        GameHaptics.select();
        onSubjectSelected(subject);
        setShowCustomInput(false);
    };

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }}>
                <View style={styles.header}>
                    <Text style={styles.avatarEmoji}>{playerAvatar}</Text>
                    <Text style={styles.headerTitle}>{playerName}, pick your subject!</Text>
                </View>
            </MotiView>

            {/* Stick with last subject */}
            {lastSubject && (
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100 }}>
                    <TouchableOpacity onPress={handleStick} activeOpacity={0.7} style={styles.stickButton}>
                        <Repeat size={18} color="#10b981" />
                        <Text style={styles.stickText}>Stick with </Text>
                        <Text style={styles.stickSubject}>{lastSubject}</Text>
                        <Text style={styles.stickText}>?</Text>
                    </TouchableOpacity>
                </MotiView>
            )}

            {/* Or switch */}
            {lastSubject && (
                <View style={styles.orRow}>
                    <View style={styles.orLine} />
                    <View style={styles.orBadge}>
                        <Shuffle size={12} color="#64748b" />
                        <Text style={styles.orText}>or switch it up</Text>
                    </View>
                    <View style={styles.orLine} />
                </View>
            )}

            {/* Subject grid */}
            <View style={styles.grid}>
                {/* Predefined subjects */}
                {predefinedAllowed.map((subject, index) => {
                    const isExpanded = expandedSubject === subject.name;
                    return (
                        <MotiView
                            key={subject.name}
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 50 + index * 30 }}
                        >
                            <TouchableOpacity
                                onPress={() => handleSubjectTap(subject)}
                                activeOpacity={0.7}
                                style={[
                                    styles.subjectCard,
                                    isExpanded && { borderColor: `${subject.color}66`, backgroundColor: `${subject.color}15` },
                                ]}
                            >
                                <View style={styles.subjectMain}>
                                    <Text style={styles.subjectIcon}>{subject.icon}</Text>
                                    <Text style={styles.subjectName}>{subject.name}</Text>
                                    {isAdult && subject.subTopics.length > 0 && (
                                        isExpanded
                                            ? <ChevronUp size={16} color="#64748b" />
                                            : <ChevronDown size={16} color="#64748b" />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Sub-topics */}
                            {isAdult && isExpanded && subject.subTopics.length > 0 && (
                                <MotiView
                                    from={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ type: "timing", duration: 200 }}
                                    style={styles.subTopicsContainer}
                                >
                                    <View style={styles.subTopicsGrid}>
                                        {subject.subTopics.map((st) => (
                                            <TouchableOpacity
                                                key={st}
                                                onPress={() => handleSubTopicTap(st)}
                                                activeOpacity={0.7}
                                                style={[styles.subTopicChip, { borderColor: `${subject.color}44` }]}
                                            >
                                                <Text style={[styles.subTopicText, { color: subject.color }]}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => onSubjectSelected(subject.name)}
                                        style={[styles.broadButton, { backgroundColor: `${subject.color}22`, borderColor: `${subject.color}44` }]}
                                    >
                                        <Text style={[styles.broadButtonText, { color: subject.color }]}>
                                            All {subject.name}
                                        </Text>
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                        </MotiView>
                    );
                })}

                {/* Custom subjects from onboarding */}
                {customAllowed.map((subjectName, index) => {
                    const meta = getSubjectMeta(subjectName);
                    return (
                        <MotiView
                            key={subjectName}
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 50 + (predefinedAllowed.length + index) * 30 }}
                        >
                            <TouchableOpacity
                                onPress={() => handleCustomSubjectTap(subjectName)}
                                activeOpacity={0.7}
                                style={[styles.subjectCard, styles.customSubjectCard]}
                            >
                                <View style={styles.subjectMain}>
                                    <Text style={styles.subjectIcon}>{meta.icon}</Text>
                                    <Text style={styles.subjectName}>{subjectName}</Text>
                                    <View style={styles.customBadge}>
                                        <Text style={styles.customBadgeText}>CUSTOM</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </MotiView>
                    );
                })}

                {/* "Try something new" — on-the-fly custom subject */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 50 + (predefinedAllowed.length + customAllowed.length) * 30 }}
                >
                    {showCustomInput ? (
                        <View style={styles.customInputContainer}>
                            <CustomSubjectInput
                                onAdd={handleTryNew}
                                existingSubjects={allowedSubjects || []}
                                maxReached={false}
                                placeholder="Type any topic..."
                            />
                            <TouchableOpacity onPress={() => setShowCustomInput(false)} style={styles.cancelCustomButton}>
                                <Text style={styles.cancelCustomText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => { setShowCustomInput(true); GameHaptics.select(); }}
                            activeOpacity={0.7}
                            style={styles.tryCustomButton}
                        >
                            <PenLine size={18} color={CUSTOM_SUBJECT_COLOR} />
                            <Text style={styles.tryCustomText}>Try something new...</Text>
                        </TouchableOpacity>
                    )}
                </MotiView>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatarEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    headerTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    stickButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 56,
        borderRadius: 16,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        borderColor: "rgba(16, 185, 129, 0.3)",
        marginBottom: 16,
    },
    stickText: {
        color: "#94a3b8",
        fontSize: 16,
        fontWeight: "600",
    },
    stickSubject: {
        color: "#10b981",
        fontSize: 16,
        fontWeight: "bold",
    },
    orRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#1e293b",
    },
    orBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    orText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "600",
    },
    grid: {
        gap: 8,
    },
    subjectCard: {
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1e293b",
    },
    subjectMain: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    subjectIcon: {
        fontSize: 22,
    },
    subjectName: {
        flex: 1,
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    subTopicsContainer: {
        paddingHorizontal: 8,
        paddingBottom: 4,
        marginTop: 4,
    },
    subTopicsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
    },
    subTopicChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        borderWidth: 1,
    },
    subTopicText: {
        fontSize: 13,
        fontWeight: "600",
    },
    broadButton: {
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
    },
    broadButtonText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    // Custom subject cards
    customSubjectCard: {
        borderStyle: "dashed",
        borderColor: "rgba(124, 58, 237, 0.4)",
        backgroundColor: "rgba(124, 58, 237, 0.06)",
    },
    customBadge: {
        backgroundColor: "rgba(124, 58, 237, 0.15)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    customBadgeText: {
        color: "#7c3aed",
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    // "Try something new" button + input
    tryCustomButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 52,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "rgba(124, 58, 237, 0.3)",
        borderStyle: "dashed",
        backgroundColor: "rgba(124, 58, 237, 0.04)",
    },
    tryCustomText: {
        color: "#7c3aed",
        fontSize: 15,
        fontWeight: "600",
    },
    customInputContainer: {
        gap: 8,
    },
    cancelCustomButton: {
        alignItems: "center",
        paddingVertical: 8,
    },
    cancelCustomText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "600",
    },
});
