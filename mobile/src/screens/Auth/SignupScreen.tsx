import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth, UserRole } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// Assets
const logoO = require("../../../assets/logoO.png");
const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<any>;

const roles: { value: UserRole; label: string }[] = [
  { value: "NORMAL_USER", label: "Normal User" },
  { value: "SAFAI_KARMI", label: "Safai Karmi" },
  { value: "SANSTHA", label: "NGOs / Sanstha" }
];

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();

  // Form State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("NORMAL_USER");

  // UI State
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Entrance Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // --- Animation Logic ---
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

  const onSubmit = async () => {
    const pwdOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
    if (!pwdOk) {
      Alert.alert(
        "Weak password",
        "Use at least 8 chars with upper, lower, number, and special symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    try {
      setLoading(true);
      await signup({ name, username: username.trim().toLowerCase(), email: email.trim(), password, role });
    } catch (e: any) {
      const message = e?.message || e?.response?.data?.message || "Please try again";
      Alert.alert("Signup failed", message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    placeholder: string,
    value: string,
    setValue: (t: string) => void,
    iconName?: keyof typeof Ionicons.glyphMap,
    secure: boolean = false,
    toggleSecure?: () => void,
    keyType: 'default' | 'email-address' = 'default'
  ) => {
    const isFocused = focusedInput === placeholder;
    return (
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#555"
          autoCapitalize="none"
          keyboardType={keyType}
          value={value}
          onChangeText={setValue}
          secureTextEntry={secure}
          onFocus={() => setFocusedInput(placeholder)}
          onBlur={() => setFocusedInput(null)}
        />
        {toggleSecure && (
          <TouchableOpacity onPress={toggleSecure}>
            <Ionicons
              name={secure ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#000"
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}
        {!toggleSecure && iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color="#555"
            style={styles.inputIcon}
          />
        )}
      </View>
    );
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.welcomeText}>Be a Guardian!</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {renderInput("Name", name, setName)}
              {renderInput("Username", username, setUsername)}
              {renderInput("Email", email, setEmail, "mail-outline", false, undefined, "email-address")}
              {renderInput("Password", password, setPassword, undefined, !showPassword, () => setShowPassword(!showPassword))}
              {renderInput("Confirm Password", confirmPassword, setConfirmPassword, undefined, !showConfirm, () => setShowConfirm(!showConfirm))}

              {/* Role Selection */}
              <Text style={styles.label}>I am a</Text>
              <View style={styles.roleRow}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleChip, role === r.value && styles.roleChipSelected]}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === r.value && styles.roleChipTextSelected
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.signupButton} onPress={onSubmit} disabled={loading} activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.hasAccountText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentContainer: {
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
  wave1: { backgroundColor: "rgba(187, 222, 251, 0.5)", top: height * 0.35, left: -width * 0.2 },
  wave2: { backgroundColor: "rgba(144, 202, 249, 0.4)", top: height * 0.40, right: -width * 0.4 },
  wave3: { backgroundColor: "rgba(33, 150, 243, 0.2)", top: height * 0.48, left: -width * 0.1 },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
    marginBottom: 0,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 22,
    color: "#0277BD", // Deep Blue
    fontWeight: "500",
    marginTop: 4,
  },
  // Form
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
    backgroundColor: '#fff',
  },
  inputFocused: {
    borderColor: "#29B6F6", // Sky Blue
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    height: '100%',
  },
  inputIcon: {
    marginLeft: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  roleChip: {
    borderWidth: 1,
    borderColor: "#29B6F6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  roleChipSelected: {
    backgroundColor: "#29B6F6",
  },
  roleChipText: {
    color: "#29B6F6",
    fontSize: 12,
    fontWeight: '500'
  },
  roleChipTextSelected: {
    color: "#fff",
    fontWeight: '700'
  },

  signupButton: {
    backgroundColor: "#29B6F6", // Sky Blue
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  hasAccountText: {
    color: '#000',
    fontSize: 14,
  },
  loginText: {
    color: "#0288D1", // Action Blue
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SignupScreen;
