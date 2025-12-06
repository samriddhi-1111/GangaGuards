import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, StatusBar, Animated, Easing, ActivityIndicator, Alert, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";

const logoO = require("../../../assets/logoO.png");
const { width, height } = Dimensions.get("window");

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Entrance Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // --- Animation Logic (Shared with WelcomeScreen) ---
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start Wave Animations
    const startFlow = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    startFlow(anim1, 5000);
    startFlow(anim2, 6500);
    startFlow(anim3, 5500);
    startFlow(anim4, 6000);

    // Start Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const moveX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const moveY1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const rotate1 = anim1.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "-12deg"] });

  const moveX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });
  const moveY2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [5, -5] });
  const rotate2 = anim2.interpolate({ inputRange: [0, 1], outputRange: ["10deg", "16deg"] });

  const moveX3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const moveY3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const rotate3 = anim3.interpolate({ inputRange: [0, 1], outputRange: ["-5deg", "0deg"] });

  const moveX4 = anim4.interpolate({ inputRange: [0, 1], outputRange: [50, -50] });
  const moveY4 = anim4.interpolate({ inputRange: [0, 1], outputRange: [5, 20] });
  const rotate4 = anim4.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "-8deg"] });
  // ---------------------------------------------------

  const onSubmit = async () => {
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (e: any) {
      const message = e?.message || e?.response?.data?.message || "Please try again";
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Background Waves */}
      <View style={styles.waveSection} pointerEvents="none">
        <Animated.View style={[styles.wave, styles.wave1, { transform: [{ translateX: moveX1 }, { translateY: moveY1 }] }]} />
        <Animated.View style={[styles.wave, styles.wave2, { transform: [{ translateX: moveX2 }, { translateY: moveY2 }] }]} />
        <Animated.View style={[styles.wave, styles.wave3, { transform: [{ translateX: moveX3 }, { translateY: moveY3 }] }]} />
      </View>

      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={logoO} style={styles.logo} />
          <Text style={styles.brandName}>GangaGuards</Text>
          <Text style={styles.welcomeText}>Welcome back Guardian!</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={[
            styles.inputContainer,
            focusedInput === 'email' && styles.inputFocused
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
            <Ionicons
              name="mail-outline"
              size={20}
              color={focusedInput === 'email' ? "#0288D1" : "#888"}
              style={styles.inputIcon}
            />
          </View>

          <View style={[
            styles.inputContainer,
            focusedInput === 'password' && styles.inputFocused
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={focusedInput === 'password' ? "#0288D1" : "#888"}
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={onSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.noAccountText}>Don't have account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    zIndex: 10,
  },
  // Animation Styles
  waveSection: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    overflow: 'hidden',
  },
  wave: {
    position: "absolute",
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: 800,
  },
  wave1: {
    backgroundColor: "rgba(187, 222, 251, 0.5)", // Light Blue
    top: height * 0.35,
    left: -width * 0.2,
  },
  wave2: {
    backgroundColor: "rgba(144, 202, 249, 0.4)", // Blue
    top: height * 0.40,
    right: -width * 0.4,
  },
  wave3: {
    backgroundColor: "rgba(33, 150, 243, 0.2)", // Darker Blue
    top: height * 0.45,
    left: -width * 0.1,
  },
  // Header
  header: {
    alignItems: "center",
    marginBottom: 30, // Reduced from 40 for tighter look
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 0, // Tightened spacing
  },
  brandName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4, // Tightened spacing
  },
  welcomeText: {
    fontSize: 20,
    color: "#0277BD", // Deep Blue
    fontWeight: '500',
    marginTop: 8,
  },
  // Form
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5, // Slightly thicker for feedback
    borderColor: "#E5E7EB",
    borderRadius: 12, // Softer corners
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 54, // Taller inputs
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: "#29B6F6", // Sky Blue
    shadowColor: "#29B6F6",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    height: '100%',
  },
  inputIcon: {
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: "#29B6F6", // Sky Blue
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#000',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  noAccountText: {
    color: '#000',
    fontSize: 14,
  },
  signupText: {
    color: "#0288D1",
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginScreen;
