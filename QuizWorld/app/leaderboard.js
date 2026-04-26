import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function Leaderboard() {
  const router = useRouter();

  const [data, setData] = useState([]);

  // 🔄 REFRESH AUTO
  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  // 🧠 CLASSEMENT INTELLIGENT
  const generateSmartLeaderboard = (userScore) => {
    const base = Math.max(userScore, 300);

    const aiPlayers = [
      { name: "👑 TITAN", score: base + 1200, boss: true },
      { name: "🔥 Sidy", score: base + 800 },
      { name: "⚡ Alpha", score: base + 500 },
      { name: "🧠 Aicha", score: base + 300 },
      { name: "🚀 Nova", score: base + 150 },
      { name: "💎 Kamoudou", score: base + 50 },
      { name: "🎯 Mariame", score: base - 100 },
      { name: "📚 Neo", score: base - 250 },
      { name: "🎮 Rookie", score: base - 400 },
    ];

    const all = [
      ...aiPlayers,
      { name: "🟢 TOI", score: userScore },
    ];

    return all
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  // 🔥 LOAD DATA SAFE
  const loadLeaderboard = async () => {
    try {
      const historyData = await AsyncStorage.getItem("HISTORY");

      let history = [];
      if (historyData) {
        try {
          history = JSON.parse(historyData);
        } catch {
          history = [];
        }
      }

      const best = history.length
        ? Math.max(...history.map((h) => h.score))
        : 0;

      const board = generateSmartLeaderboard(best);

      setData(board);
    } catch (e) {
      console.log(e);
    }
  };

  // 🎨 STYLE RANG
  const getRankStyle = (index) => {
    if (index === 0) return { color: "#FFD700" };
    if (index === 1) return { color: "#C0C0C0" };
    if (index === 2) return { color: "#CD7F32" };
    return { color: "white" };
  };

  // 🔥 ITEM MEMO (performance)
  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        item.name === "🟢 TOI" && styles.youRow,
        item.boss && styles.bossRow,
      ]}
    >
      <Text style={[styles.rank, getRankStyle(index)]}>
        #{index + 1}
      </Text>

      <Text style={styles.name}>{item.name}</Text>

      <Text style={styles.score}>💰 {item.score}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 CLASSEMENT</Text>

      {data.length === 0 ? (
        <Text style={styles.empty}>Aucun score pour le moment</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  empty: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },

  youRow: {
    backgroundColor: "#1E3A8A",
  },

  bossRow: {
    backgroundColor: "#7C3AED",
  },

  rank: {
    fontSize: 18,
    fontWeight: "bold",
  },

  name: {
    color: "white",
    fontSize: 16,
  },

  score: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});