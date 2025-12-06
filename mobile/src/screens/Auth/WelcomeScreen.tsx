
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, StatusBar, Animated, Easing } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Assets
const logoO = require("../../../assets/logoO.png");

const { width, height } = Dimensions.get("window");

const WelcomeScreen: React.FC<NativeStackScreenProps<any>> = ({ navigation }) => {
  // Animation values for waves
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  // Pulse animation for button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Helper to create infinite flowing animation
    const startFlow = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Slower, more graceful durations for river effect
    startFlow(anim1, 5000);
    startFlow(anim2, 6500);
    startFlow(anim3, 5500);
    startFlow(anim4, 6000);

    // Button Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Interpolations for realistic river movement
  // Moderate ranges: noticeable but not chaotic

  // Wave 1: Gentle base current
  const moveX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const moveY1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });

  // Wave 2: Counter-flow
  const moveX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });
  const moveY2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [5, -5] });

  // Wave 3: Background swell
  const moveX3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const moveY3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top Section - Title */}
      <View style={styles.headerContainer}>
        <Text style={styles.titleText}>
          Stand up for Maa Ganga!
        </Text>
        <Text style={styles.subtitleText}>
          Be her Guardian
        </Text>
      </View>

      {/* Middle Section - Waves & Logo */}
      <View style={styles.waveSection}>
        {/* Background Waves - Animated Views */}
        <Animated.View
          style={[styles.wave, styles.wave1, { transform: [{ translateX: moveX1 }, { translateY: moveY1 }] }]}
        />
        <Animated.View
          style={[styles.wave, styles.wave2, { transform: [{ translateX: moveX2 }, { translateY: moveY2 }] }]}
        />
        <Animated.View
          style={[styles.wave, styles.wave3, { transform: [{ translateX: moveX3 }, { translateY: moveY3 }] }]}
        />

        {/* Center Logo Bubble */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image source={logoO} style={styles.logoImage} />
          </View>
        </View>
      </View>

      {/* Bottom Section - Button */}
      <View style={styles.footerContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate("Signup")}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: 'space-between',
  },
  headerContainer: {
    paddingTop: height * 0.1,
    alignItems: "center",
    zIndex: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0277BD", // Deep Blue
    textAlign: "center",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0277BD", // Deep Blue
    textAlign: "center",
  },
  waveSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },
  // Abstract wave shapes
  wave: {
    position: "absolute",
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: 800, // Large radius for curvature
    opacity: 0.5,
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
  logoContainer: {
    position: 'absolute',
    top: height * 0.40, // Centered vertically relative to screen approximately
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logoImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  footerContainer: {
    paddingBottom: 60,
    paddingHorizontal: 30,
    zIndex: 10,
    alignItems: 'center',
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: "#29B6F6", // Sky Blue
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20, // Taller button
    paddingHorizontal: 30,
    borderRadius: 35, // More rounded
    width: '100%',
    elevation: 8, // Higher shadow
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20, // Larger text
    fontWeight: "700",
    marginRight: 12,
    letterSpacing: 0.5,
  },
  arrowIcon: {
    color: "#FFFFFF",
    fontSize: 24, // Larger arrow
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
