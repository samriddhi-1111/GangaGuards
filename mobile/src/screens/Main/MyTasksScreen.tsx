import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Image,
  StatusBar,
  Modal,
  Dimensions,
  Animated,
  Easing
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTasks, Incident } from "../../context/TasksContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import SuccessModal from "../../components/SuccessModal";

const { width, height } = Dimensions.get("window");
const logoO = require("../../../assets/logoO.png");

const MyTasksScreen: React.FC = () => {
  const { user, updateUserPoints } = useAuth();
  const { myTasks, completeTask, fetchUserTasks } = useTasks();
  const navigation = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      fetchUserTasks();
    }, [])
  );

  const [activeTab, setActiveTab] = useState<'ACCEPTED' | 'COMPLETED'>('ACCEPTED');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Success Modal State
  const [successVisible, setSuccessVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const transX = useRef(new Animated.Value(0)).current;

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
    startFlow(anim3, 6000);
  }, []);

  const moveX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const moveY1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const moveX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });
  const moveY2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [5, -5] });
  const moveX3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const moveY3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  // Trigger LayoutAnimation when tab changes
  useEffect(() => {
    Animated.timing(transX, {
      toValue: activeTab === 'ACCEPTED' ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
  }, [activeTab]);

  const openMaps = (location?: { coordinates: [number, number] }) => {
    // FORCE NAVIGATION TO USER SPECIFIED ASSI GHAT
    const lat = 25.285217;
    const lng = 82.790942;

    const url = Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(url);
  };

  const handleComplete = async (id: string, isDummy?: boolean) => {
    // Check permission
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "We need access to your photos to upload.");
      return;
    }

    // Launch Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });

    if (result.canceled || !result.assets.length) return;

    // Upload & Complete
    try {
      setLoading(true);
      await completeTask(id, result.assets[0].uri);
      setActiveTab('COMPLETED');
      setSuccessTitle("Shabash! 🎉");
      setSuccessMessage("Task completed successfully! You earned 10 coins.");
      setSuccessVisible(true);
    } catch (e) {
      Alert.alert("Error", "Failed to upload task completion.");
    } finally {
      setLoading(false);
    }
  };

  const openImage = (url: string) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  const renderCard = ({ item }: { item: Incident }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <Text style={styles.cardTitle}>{item.addressText || "Ganga Ghat"}</Text>
            <Text style={styles.cardSubtitle}>
              {activeTab === 'ACCEPTED' ? "Ready to be cleaned" : "Successfully Cleaned"}
            </Text>

            {/* Action Buttons Row */}
            <View style={styles.buttonRow}>
              {/* View Image Button (Always visible if accepted, or if user wants to see what they cleaned) */}
              <TouchableOpacity style={styles.outlineButton} onPress={() => openImage(item.imageBeforeUrl)}>
                <Text style={styles.outlineButtonText}>View Image</Text>
              </TouchableOpacity>


              {/* Track Button (Only key for Accepted) */}
              {activeTab === 'ACCEPTED' && (
                <TouchableOpacity style={styles.outlineButton} onPress={() => openMaps(item.location)}>
                  <Text style={styles.outlineButtonText}>Track</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Right Section - Primary Action */}
          <View style={styles.rightSection}>
            {activeTab === 'ACCEPTED' ? (
              <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item._id, item.isDummy)}>
                <MaterialCommunityIcons name="camera-plus" size={24} color="#000" />
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Image source={logoO} style={styles.logo} />
        <TouchableOpacity
          style={styles.coinsContainer}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Points")}
        >
          <Text style={styles.coinText}>🪙 {user?.points || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Page Title & Subtitle */}
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>My Tasks</Text>
        <Text style={styles.pageSubtitle}>Track your impact and earnings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ACCEPTED' && styles.activeTab]}
          onPress={() => setActiveTab('ACCEPTED')}
        >
          <Text style={[styles.tabText, activeTab === 'ACCEPTED' && styles.activeTabText]}>Accepted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'COMPLETED' && styles.activeTab]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* List */}

      {/* Animated Slide Container */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: width * 2, // Two screens wide
            transform: [{
              translateX: transX
            }]
          }}
        >
          {/* Accepted List */}
          <View style={{ width: width }}>
            <FlatList
              data={myTasks.filter(t => t.status === 'CLAIMED')}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              renderItem={renderCard}
              ListEmptyComponent={
                <View style={styles.centerEmpty}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#CCC" />
                  <Text style={{ color: "#000", marginTop: 10 }}>No tasks in progress.</Text>
                  <Text style={{ color: "#000", marginTop: 5, fontWeight: '500' }}>Check Nearby Tasks!</Text>
                </View>
              }
            />
          </View>

          {/* Completed List */}
          <View style={{ width: width }}>
            <FlatList
              data={myTasks.filter(t => t.status === 'CLEANED')}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              renderItem={renderCard}
              ListEmptyComponent={
                <View style={styles.centerEmpty}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={48} color="#CCC" />
                  <Text style={{ color: "#000", marginTop: 10 }}>No completed tasks yet.</Text>
                </View>
              }
            />
          </View>

        </Animated.View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : null}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 10,
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
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#000',
    marginTop: 4
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  activeTabText: {
    color: '#000',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  centerEmpty: {
    alignItems: 'center',
    marginTop: 50,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAF6',
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 12,
    fontWeight: '600',
  },
  completeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#c3e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  completedBadge: {
    // Just icon
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '80%',
    backgroundColor: '#000',
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

  // Animation Styles
  waveSection: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0, // Keep at 0, ensure others are higher if needed
    overflow: 'hidden',
  },
  wave: {
    position: "absolute",
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: 800,
    opacity: 0.6, // Increased opacity
  },
  wave1: { backgroundColor: "rgba(187, 222, 251, 0.8)", top: height * 0.45, left: -width * 0.2 },
  wave2: { backgroundColor: "rgba(144, 202, 249, 0.6)", top: height * 0.5, right: -width * 0.4 },
  wave3: { backgroundColor: "rgba(100, 181, 246, 0.5)", top: height * 0.55, left: -width * 0.1 },

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

export default MyTasksScreen;
