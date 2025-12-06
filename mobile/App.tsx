import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Alert, Text, TouchableOpacity, Linking } from "react-native";
import * as Location from "expo-location";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { TasksProvider } from "./src/context/TasksContext";
import WelcomeScreen from "./src/screens/Auth/WelcomeScreen";
import LoginScreen from "./src/screens/Auth/LoginScreen";
import SignupScreen from "./src/screens/Auth/SignupScreen";
import MainTabs from "./src/navigation/MainTabs";
import PointsScreen from "./src/screens/Main/PointsScreen";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const [locationStatus, setLocationStatus] = React.useState<"checking" | "granted" | "denied">("checking");

  const requestLocation = React.useCallback(async () => {
    try {
      // Always ask explicitly to ensure the system prompt shows
      const result = await Location.requestForegroundPermissionsAsync();
      const granted = result.status === "granted";
      setLocationStatus(granted ? "granted" : "denied");
      if (!granted) {
        Alert.alert(
          "Location required",
          "Please enable location to see nearby garbage incidents within 10 km."
        );
      }
    } catch (err) {
      console.warn("Location permission error", err);
      setLocationStatus("denied");
    }
  }, []);

  // Ask for location on app start and again whenever auth state changes (after signup/login)
  React.useEffect(() => {
    requestLocation();
  }, [requestLocation, user]);

  if (loading || locationStatus === "checking") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1e88e5" />
      </View>
    );
  }

  if (locationStatus === "denied") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, textAlign: "center" }}>
          Location access is required
        </Text>
        <Text style={{ color: "#555", textAlign: "center", marginBottom: 16 }}>
          Enable location to see garbage incidents within 10 km and accept tasks.
        </Text>
        <TouchableOpacity
          onPress={requestLocation}
          style={{ paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#1565C0", borderRadius: 10, marginBottom: 10 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Allow Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: "#1565C0" }}
        >
          <Text style={{ color: "#1565C0", fontWeight: "700" }}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Points" component={PointsScreen} options={{ presentation: 'modal' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <TasksProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </TasksProvider>
    </AuthProvider>
  );
};

export default App;


