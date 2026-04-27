import { useState, useCallback } from "react";
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

const AI_NAMES = [
  "👑 TITAN",
  "🔥 Sidy",
  "⚡ Alpha",
  "🧠 Aicha",
  "🚀 Nova",
  "💎 Kamoudou",
  "🎯 Mariame",
  "📚 Neo",
  "🎮 Rookie",
];

export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState([]);

  // 🔄 REFRESH
  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  // 🧠 CRÉATION IA
  const createAIPlayers = () => {
    return AI_NAMES.map((name, i) => ({
      name,
      score: 300 + Math.floor(Math.random() * 500) + i * 50,
    }));
  };

  // 🧠 EVOLUTION INTELLIGENTE
  const evolveScores = (players, userScore) => {
    return players.map((p) => {
      if (p.name === "🟢 TOI") return { ...p, score: userScore };

      // 🔥 IA évolue intelligemment
      let variation = Math.floor(Math.random() * 200) - 80;

      // IA forte monte plus
      if (p.score > userScore) variation += 50;

      // IA faible chute parfois
      if (p.score < userScore) variation -= 20;

      return {
        ...p,
        score: Math.max(0, p.score + variation),
      };
    });
  };

  // 🔥 LOAD GLOBAL
  const loadLeaderboard = async () => {
    try {
      const historyData = await AsyncStorage.getItem("HISTORY");

      let history = [];
      try {
        history = historyData ? JSON.parse(historyData) : [];
      } catch {
        history = [];
      }

      if (!Array.isArray(history)) history = [];

      const userScore = history.length
        ? Math.max(...history.map((h) => h.score || 0))
        : 0;

      // 🔁 Charger ancien leaderboard
      const savedBoard = await AsyncStorage.getItem("LEADERBOARD_STATE");

      let players;

      if (savedBoard) {
        players = JSON.parse(savedBoard);
      } else {
        players = createAIPlayers();
      }

      // ➕ Ajouter joueur
      players = [
        ...players.filter((p) => p.name !== "🟢 TOI"),
        { name: "🟢 TOI", score: userScore },
      ];

      // 🔥 EVOLUTION
      players = evolveScores(players, userScore);

      // 🔥 TRI FINAL
      players.sort((a, b) => b.score - a.score);

      const finalBoard = players.slice(0, 10);

      setData(finalBoard);

      // 💾 SAVE
      await AsyncStorage.setItem(
        "LEADERBOARD_STATE",
        JSON.stringify(finalBoard)
      );

    } catch (e) {
      console.log("LEADERBOARD ERROR:", e);
    }
  };

  // 🎨 STYLE
  const getRankStyle = (index) => {
    if (index === 0) return { color: "#FFD700" };
    if (index === 1) return { color: "#C0C0C0" };
    if (index === 2) return { color: "#CD7F32" };
    return { color: "white" };
  };

  // 🎯 ITEM
  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        item.name === "🟢 TOI" && styles.youRow,
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
      <Text style={styles.title}>🏆 CLASSEMENT VIVANT</Text>

      {data.length === 0 ? (
        <Text style={styles.empty}>Chargement...</Text>
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

// 🎨 STYLE
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