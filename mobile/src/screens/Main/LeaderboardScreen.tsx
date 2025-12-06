import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Image, Alert, SafeAreaView, Dimensions, StatusBar, Platform, Animated, Easing } from "react-native";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const logoO = require("../../../assets/logoO.png");

type Period = "weekly" | "monthly" | "all-time";

interface Entry {
  rank: number;
  userId: string;
  name: string;
  role: any;
  periodPoints: number;
  totalPoints: number;
  totalCleaned: number;
  profileImage?: string;
}



// Dummy Data
const DUMMY_DATA: Entry[] = [
  { rank: 1, userId: '1', name: 'Ganga', role: 'Guardian', periodPoints: 124, totalPoints: 124, totalCleaned: 10, profileImage: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { rank: 2, userId: '2', name: 'Shivansh', role: 'Guardian', periodPoints: 120, totalPoints: 120, totalCleaned: 8, profileImage: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { rank: 3, userId: '3', name: 'Samriddhi', role: 'Guardian', periodPoints: 113, totalPoints: 113, totalCleaned: 7, profileImage: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const LeaderboardScreen: React.FC = () => {
  const [period, setPeriod] = useState<Period>("weekly");
  const [entries, setEntries] = useState<Entry[]>(DUMMY_DATA);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigation = useNavigation<any>();

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

  const fetchData = async (p: Period) => {
    try {
      const resp = await api.client.get(`/leaderboard/${p}`);
      if (resp.data && resp.data.length > 0) {
        if (resp.data && resp.data.length > 0) {
          const sorted = resp.data.sort((a: Entry, b: Entry) => b.totalPoints - a.totalPoints);
          const ranked = sorted.map((item: Entry, index: number) => ({ ...item, rank: index + 1 }));
          setEntries(ranked);
        }
      }
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData(period);
    });
    return unsubscribe;
  }, [navigation, period]);

  const renderPodiumItem = (entry: Entry, position: 'first' | 'second' | 'third') => {
    let containerStyle = {};
    let avatarSize = 70;
    let badgeColor = "#000";
    let crown = false;

    if (position === 'first') {
      containerStyle = { marginBottom: 30, zIndex: 10 };
      avatarSize = 90;
      badgeColor = "#FFD700"; // Gold
      crown = true;
    } else if (position === 'second') {
      containerStyle = { marginTop: 20 };
      badgeColor = "#C0C0C0"; // Silver
    } else {
      containerStyle = { marginTop: 20 };
      badgeColor = "#CD7F32"; // Bronze
    }

    return (
      <View style={[styles.podiumItem, containerStyle]}>
        {crown && (
          <View style={styles.crownContainer}>
            <MaterialCommunityIcons name="crown" size={32} color="#FFD700" />
          </View>
        )}

        <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize, borderColor: badgeColor }]}>
          <Image
            source={{ uri: entry.profileImage || `https://ui-avatars.com/api/?name=${entry.name}&background=random&color=fff` }}
            style={{ width: '100%', height: '100%', borderRadius: avatarSize / 2 }}
          />
          <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.rankText}>{entry.rank}</Text>
          </View>
        </View>

        <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>

        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>🪙 {entry.totalPoints}</Text>
        </View>
      </View>
    )
  };

  const renderListItem = ({ item }: { item: Entry }) => {
    const isMe = user?._id === item.userId;
    return (
      <View style={[styles.listItem, isMe && styles.listItemMe]}>
        <Text style={styles.listRank}>{item.rank}</Text>
        <Image
          source={{ uri: item.profileImage || `https://ui-avatars.com/api/?name=${item.name}&background=random&color=fff` }}
          style={styles.listAvatar}
        />
        <Text style={styles.listName} numberOfLines={1}>
          {item.name} {isMe && "(You)"}
        </Text>
        <View style={styles.listScoreContainer}>
          <Text style={styles.listScore}>🪙 {item.totalPoints}</Text>
        </View>
      </View>
    );
  }

  const top3 = entries.slice(0, 3);
  const others = entries.slice(3);
  const first = top3.find(e => e.rank === 1);
  const second = top3.find(e => e.rank === 2);
  const third = top3.find(e => e.rank === 3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* GLOBAL WAVE BACKGROUND - MATCHING NEARBY TASKS */}
      <View style={styles.waveBackground} pointerEvents="none">
        <Animated.View style={[styles.wave, styles.wave1, { transform: [{ translateX: moveX1 }, { translateY: moveY1 }] }]} />
        <Animated.View style={[styles.wave, styles.wave2, { transform: [{ translateX: moveX2 }, { translateY: moveY2 }] }]} />
        <Animated.View style={[styles.wave, styles.wave3, { transform: [{ translateX: moveX3 }, { translateY: moveY3 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Image source={logoO} style={styles.logo} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.pageTitle}>Leaderboard</Text>
        </View>
        <TouchableOpacity style={styles.coinsContainer} onPress={() => navigation.navigate("Points")}>
          <Text style={styles.coinText}>🪙 {user?.points || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setPeriod("weekly")}>
          <Text style={[styles.toggleText, period === "weekly" && styles.toggleTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <View style={styles.toggleDivider} />
        <TouchableOpacity onPress={() => setPeriod("monthly")}>
          <Text style={[styles.toggleText, period === "monthly" && styles.toggleTextActive]}>Monthly</Text>
        </TouchableOpacity>
        <View style={styles.toggleDivider} />
        <TouchableOpacity onPress={() => setPeriod("all-time")}>
          <Text style={[styles.toggleText, period === "all-time" && styles.toggleTextActive]}>All Time</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6b6eb8" />
        </View>
      ) : (
        <>
          {/* Top Section (Podium only, waves are now global) */}
          <View style={styles.topSection}>
            {/* Podium Section */}
            <View style={styles.podiumContainer}>
              <View style={styles.podiumColumn}>
                {second ? renderPodiumItem(second, 'second') : <View style={{ width: 80 }} />}
              </View>
              <View style={styles.podiumColumn}>
                {first ? renderPodiumItem(first, 'first') : <View style={{ width: 90 }} />}
              </View>
              <View style={styles.podiumColumn}>
                {third ? renderPodiumItem(third, 'third') : <View style={{ width: 80 }} />}
              </View>
            </View>
          </View>

          {/* List Section */}
          <View style={styles.listContainer}>
            <FlatList
              data={others}
              keyExtractor={(item) => item.userId}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#000' }}>
                  No other guardians yet.
                </Text>
              }
            />
          </View>
        </>
      )
      }
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Matched NearbyTasks base
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 225, 0.9)',
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

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 0,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  toggleText: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#ccc',
  },

  // Top Section Container (holds podium)
  topSection: {
    position: 'relative',
    height: 240, // Height for podium
    justifyContent: 'flex-end',
    paddingBottom: 20,
    zIndex: 10,
  },
  waveBackground: {
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
  wave3: { backgroundColor: "rgba(100, 181, 246, 0.3)", top: height * 0.6, left: -width * 0.1 }, // Bottom wave

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 10, // Above waves
  },
  podiumColumn: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  podiumItem: {
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 100,
    borderWidth: 3,
    padding: 2,
    backgroundColor: '#fff',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 2,
  },
  rankText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  crownContainer: {
    position: 'absolute',
    top: -38,
    zIndex: 10,
  },
  podiumName: {
    marginTop: 15,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 100,
    color: '#000',
  },
  scorePill: {
    marginTop: 4,
  },
  scoreText: {
    fontSize: 12,
    color: '#000',
  },

  // List Container
  listContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 0,
    marginTop: -10, // Slight overlap
    zIndex: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glassy
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  listItemMe: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
  },
  listRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    width: 30,
    textAlign: 'center',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  listName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  listScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default LeaderboardScreen;
