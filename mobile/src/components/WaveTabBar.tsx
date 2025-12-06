import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const WaveTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.tabRow}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    let iconName: keyof typeof Ionicons.glyphMap = "home";
                    if (route.name === "Nearby") iconName = "location";
                    if (route.name === "My Tasks") iconName = "checkmark-circle";
                    if (route.name === "Leaderboard") iconName = "stats-chart";
                    if (route.name === "Profile") iconName = "person-circle";

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={styles.tabButton}
                        >
                            <Ionicons
                                name={iconName}
                                size={32}
                                color={isFocused ? "#29B6F6" : "#999"}
                            />
                            <Text style={{ color: isFocused ? "#29B6F6" : "#999", fontSize: 13, marginTop: 4, fontWeight: isFocused ? '600' : '400' }}>
                                {route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 25,
        paddingTop: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        height: 95,
    },
    tabRow: {
        flexDirection: 'row',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default WaveTabBar;
