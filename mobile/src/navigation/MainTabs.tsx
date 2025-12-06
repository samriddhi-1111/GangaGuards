import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import WaveTabBar from "../components/WaveTabBar";

// Screens
import NearbyTasksScreen from "../screens/Main/NearbyTasksScreen";
// Assuming other screens are in the same relative path structure
import MyTasksScreen from "../screens/Main/MyTasksScreen";
import LeaderboardScreen from "../screens/Main/LeaderboardScreen";
import ProfileScreen from "../screens/Main/ProfileScreen";

const Tab = createBottomTabNavigator();

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
            tabBar={(props) => <WaveTabBar {...props} />}
        >
            <Tab.Screen name="Nearby" component={NearbyTasksScreen} />
            <Tab.Screen name="My Tasks" component={MyTasksScreen} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabs;
