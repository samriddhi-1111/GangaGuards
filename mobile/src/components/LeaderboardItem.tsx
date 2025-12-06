import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { UserRole } from "../context/AuthContext";

interface Props {
  rank: number;
  name: string;
  role: UserRole;
  points: number;
  highlight?: boolean;
}

const roleLabel = (role: UserRole) => {
  switch (role) {
    case "SAFAI_KARMI":
      return "Safai Karmi";
    case "SANSTHA":
      return "Sanstha";
    default:
      return "Citizen";
  }
};

const LeaderboardItem: React.FC<Props> = ({
  rank,
  name,
  role,
  points,
  highlight
}) => {
  return (
    <View style={[styles.container, highlight && styles.highlight]}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{roleLabel(role)}</Text>
      </View>
      <Text style={styles.points}>{points} pts</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB"
  },
  highlight: {
    backgroundColor: "#E3F2FD"
  },
  rank: {
    width: 32,
    fontWeight: "800",
    fontSize: 16,
    color: "#1565C0"
  },
  name: {
    fontWeight: "700",
    fontSize: 15,
    color: "#0D1B2A"
  },
  role: {
    fontSize: 12,
    color: "#6B7280"
  },
  points: {
    fontWeight: "700",
    fontSize: 14,
    color: "#FFB300"
  }
});

export default LeaderboardItem;


