import React, { useState } from "react";
import { View, Text, TextInput, SafeAreaView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { ArrowRight, ArrowLeft, User, Hash } from "lucide-react-native";

export default function JoinGameScreen() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleNext = () => {
        if (!code || !name) {
            setError("Please fill in all fields");
            return;
        }

        // Navigate to profile screen with code and name as params
        router.push({
            pathname: "/onboarding/join-profile",
            params: { code, playerName: name }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.content}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#94a3b8" />
                        <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Join Game</Text>
                    <Text style={styles.subtitle}>Enter the room code to join the fun.</Text>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Room Code</Text>
                            <View style={styles.inputContainer}>
                                <Hash size={20} color="#94a3b8" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    value={code}
                                    onChangeText={(text) => setCode(text.toUpperCase())}
                                    placeholder="ABCD"
                                    placeholderTextColor="#475569"
                                    maxLength={4}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Your Name</Text>
                            <View style={styles.inputContainer}>
                                <User size={20} color="#94a3b8" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#475569"
                                />
                            </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>

                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={loading || !code || !name}
                        style={[styles.joinButton, (!code || !name) && styles.joinButtonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.joinButtonText}>Next</Text>
                                <ArrowRight size={24} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                </MotiView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
        alignSelf: 'flex-start',
        padding: 4,
    },
    backBtnText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 40,
    },
    form: {
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cbd5e1',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#1e293b',
        paddingHorizontal: 16,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: 'white',
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 8,
    },
    joinButton: {
        height: 64,
        backgroundColor: '#10b981',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    joinButtonDisabled: {
        opacity: 0.5,
    },
    joinButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
