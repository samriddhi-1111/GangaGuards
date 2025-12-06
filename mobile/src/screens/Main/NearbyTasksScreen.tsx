import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Alert, Linking, TouchableOpacity, StyleSheet, Platform, Image, StatusBar, Dimensions, Animated, Easing, Modal } from "react-native";
import * as Location from "expo-location";
import { api, resolveBaseURL } from "../../services/api";
import { getSocket } from "../../services/socket";
import { Ionicons } from "@expo/vector-icons";
import { useTasks, Incident } from "../../context/TasksContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import SuccessModal from "../../components/SuccessModal";

// Assets
const logoO = require("../../../assets/logoO.png");
const { width, height } = Dimensions.get("window");

const NearbyTasksScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const { nearbyIncidents, acceptTask, removeFromNearby, fetchNearbyIncidents } = useTasks();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const navigation = useNavigation<any>();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Success Modal State
  const [successVisible, setSuccessVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- Wave Animation Logic ---
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startFlow = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    startFlow(anim1, 5000);
    startFlow(anim2, 7000);
    startFlow(anim3, 6000);
  }, []);

  const moveX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const moveY1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const moveX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });
  const moveY2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [5, -5] });
  const moveX3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const moveY3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  const requestLocation = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const result = await Location.requestForegroundPermissionsAsync();
        if (result.status !== "granted") {
          setLocationDenied(true);
          return null;
        }
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      setLocationDenied(false);

      // Fetch nearby tasks immediately after getting location
      if (loc && loc.coords) {
        fetchNearbyIncidents(loc.coords.latitude, loc.coords.longitude);
      }

      return loc;
    } catch (error: any) {
      setLocationDenied(true);
      return null;
    }
  };

  const fetchNearby = async () => {
    if (location && location.coords) {
      setRefreshing(true);
      await fetchNearbyIncidents(location.coords.latitude, location.coords.longitude);
      setRefreshing(false);
    } else {
      requestLocation();
      setRefreshing(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleAccept = async (id: string, isDummy?: boolean) => {
    if (isDummy) {
      acceptTask(id);
      setSuccessTitle("Task Accepted!");
      setSuccessMessage("You can now find this task in the 'My Tasks' tab.");
      setSuccessVisible(true);
      return;
    }
    // Fallback for real tasks if any
    try {
      await acceptTask(id); // Use context logic
      setSuccessTitle("Task Accepted!");
      setSuccessMessage("Task accepted successfully! Go to 'My Tasks' to start cleaning.");
      setSuccessVisible(true);
    } catch (e) {
      // Error handled in context alert
      console.log("Accept aborted");
    }
  }

  const distanceKm = (i: Incident): string => {
    if (i.isDummy) return "2.4 Km";
    if (!location || !i.location?.coordinates) return "-- Km";
    const [lng, lat] = i.location.coordinates;
    const dx = (lat - location.coords.latitude) * 111;
    const dy = (lng - location.coords.longitude) * 111 * Math.cos((location.coords.latitude * Math.PI) / 180);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return `${dist.toFixed(1)} Km`;
  };

  const getImageUrl = (url: string) => {
    if (!url) return null;
    let finalUrl = url.startsWith('http') ? url : `${resolveBaseURL()}${url}`;
    if (finalUrl.includes('localhost')) {
      finalUrl = finalUrl.replace('http://localhost:4000', resolveBaseURL());
    }
    return finalUrl;
  };

  const openImage = (url: string) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  const openTrack = (location?: { coordinates: [number, number] }) => {
    // FORCE NAVIGATION TO USER SPECIFIED ASSI GHAT
    const lat = 25.285217;
    const lng = 82.790942;
    const url = Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const renderCard = ({ item }: { item: Incident }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <Text style={styles.cardTitle}>{item.addressText || "Ganga Ghat"}</Text>
            <Text style={styles.cardSubtitle}>{distanceKm(item)}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.outlineButton} onPress={() => openImage(item.imageBeforeUrl)}>
                <Text style={styles.outlineButtonText}>View Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => openTrack(item.location)}>
                <Text style={styles.outlineButtonText}>Track</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity onPress={() => handleAccept(item._id, item.isDummy)}>
              <View style={styles.iconCircleGreen}>
                <Ionicons name="checkmark" size={28} color="#4CAF50" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              Alert.alert("Declined", "Task removed from your feed.");
              removeFromNearby(item._id);
            }}>
              <View style={styles.iconCircleRed}>
                <Ionicons name="close" size={28} color="#F44336" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6b6eb8" size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Header - HIGH Z-INDEX */}
      <View style={styles.header}>
        <Image source={logoO} style={styles.logo} />
        <TouchableOpacity
          style={styles.coinsContainer}
          activeOpacity={0.7}
          onPress={() => {
            if (navigation) {
              navigation.navigate("Points");
            } else {
              console.warn("Navigation not available");
            }
          }}
        >
          <Text style={styles.coinText}>🪙 {user?.points || 0}</Text>
        </TouchableOpacity>
      </View>
      {/* Wave Background */}
      <View style={styles.waveSection} pointerEvents="none">
        <Animated.View style={[styles.wave, styles.wave1, { transform: [{ translateX: moveX1 }, { translateY: moveY1 }] }]} />
        <Animated.View style={[styles.wave, styles.wave2, { transform: [{ translateX: moveX2 }, { translateY: moveY2 }] }]} />
        <Animated.View style={[styles.wave, styles.wave3, { transform: [{ translateX: moveX3 }, { translateY: moveY3 }] }]} />
      </View>
      <FlatList
        data={nearbyIncidents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNearby(); }} tintColor="#6b6eb8" />}
        renderItem={renderCard}
        ListEmptyComponent={
          <View style={styles.centerEmpty}>
            <View style={styles.glassInfo}>
              <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Peaceful water today</Text>
              <Text style={{ textAlign: 'center', color: '#000', marginTop: 5, fontWeight: 'bold' }}>Thank you! Guardians</Text>
              <Text style={{ textAlign: 'center', color: '#000', marginTop: 5 }}>Your Guardian power will be needed soon!</Text>
            </View>
          </View>
        }
      />
      {/* Image Modal for "View Now" */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: getImageUrl(selectedImage || '') || '' }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SuccessModal
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onClose={() => setSuccessVisible(false)}
      />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  glassInfo: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 20,
    borderRadius: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 20,
    zIndex: 100, // Boosted Z-Index
    elevation: 10,
    backgroundColor: 'transparent', // Ensure clicks pass through transparent parts if any, but elements catch them
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 225, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFC107',
    zIndex: 101, // Extra boost
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
    zIndex: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9FA8DA',
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    marginRight: 10,
  },
  rightSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#c3e7ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#c3e7ff',
  },
  outlineButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  iconCircleGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 245, 233, 0.5)',
  },
  iconCircleRed: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 238, 0.5)',
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
    opacity: 0.5,
  },
  wave1: { backgroundColor: "rgba(187, 222, 251, 0.5)", top: height * 0.4, left: -width * 0.2 },
  wave2: { backgroundColor: "rgba(144, 202, 249, 0.4)", top: height * 0.5, right: -width * 0.4 },
  wave3: { backgroundColor: "rgba(100, 181, 246, 0.3)", top: height * 0.6, left: -width * 0.1 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '80%',
    backgroundColor: '#000', // Black background for better image viewing
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalImage: {
    width: '100%',
    height: '90%',
    borderRadius: 16,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#c3e7ff',
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#c3e7ff',
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default NearbyTasksScreen;
