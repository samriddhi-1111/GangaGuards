import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, Easing, SafeAreaView, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

const PointsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const dropAnim = useRef(new Animated.Value(-height / 2)).current; // Start off screen top
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(dropAnim, {
            toValue: 0,
            damping: 12,
            stiffness: 90,
            mass: 1,
            useNativeDriver: true,
        }).start();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FFA000" />
            <View style={styles.content}>

                {/* Animated Coin */}
                <Animated.View style={[styles.coinContainer, { transform: [{ translateY: dropAnim }] }]}>
                    <Text style={{ fontSize: 130 }}>🪙</Text>
                </Animated.View>

                {/* Info Card */}
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Your Guardian Points</Text>
                    <Text style={styles.points}>{user?.points || 0}</Text>
                    <Text style={styles.subtitle}>Current Balance</Text>

                    <View style={styles.divider} />

                    <Text style={styles.benefitsTitle}>Benefits Unlocked:</Text>
                    <View style={styles.benefitRow}>
                        <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                        <Text style={styles.benefitText}>Official Guardian Badge</Text>
                    </View>
                    <View style={styles.benefitRow}>
                        <Ionicons name="gift" size={24} color="#E91E63" />
                        <Text style={styles.benefitText}>Access to Rewards Store</Text>
                    </View>
                    <View style={styles.benefitRow}>
                        <Ionicons name="star" size={24} color="#FF9800" />
                        <Text style={styles.benefitText}>Feature on Leaderboard</Text>
                    </View>
                </Animated.View>

                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFA000", // Amber background
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: 'center',
        width: '100%',
        padding: 20,
    },
    coinContainer: {
        marginBottom: 40,
        width: 150,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
        overflow: 'visible',
    },
    card: {
        backgroundColor: '#fff',
        width: '90%',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
    },
    points: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FF6F00',
        marginVertical: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
        marginBottom: 20,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#eee',
        marginBottom: 20,
    },
    benefitsTitle: {
        alignSelf: 'flex-start',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
    },
    benefitText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#555',
    },
    closeButton: {
        marginTop: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    closeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default PointsScreen;
