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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const parseHistory = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 🔥 STATS BASÉES SUR 25 DERNIÈRES PARTIES
const buildStatsFromHistory = (history) => {
  const scores = history.map((item) => safeNumber(item?.score));

  const best = scores.length ? Math.max(...scores) : 0;
  const games = scores.length;

  const first = scores[0] || 0;
  const last = scores[scores.length - 1] || 0;

  const average =
    scores.length > 0
      ? scores.reduce((sum, n) => sum + n, 0) / scores.length
      : 0;

  const recentScores = scores.slice(-5);
  const recentAverage =
    recentScores.length > 0
      ? recentScores.reduce((sum, n) => sum + n, 0) /
        recentScores.length
      : 0;

  let streak = 0;
  for (let i = scores.length - 1; i >= 1; i--) {
    if (scores[i] > scores[i - 1]) streak++;
    else break;
  }

  const improvement = last - first;
  const trend = recentAverage - average;

  return {
    best,
    games,
    average,
    recentAverage,
    streak,
    improvement,
    trend,
  };
};

export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  const createAIPlayers = (userScore) => {
    const base = Math.max(userScore, 300);

    return [
      { name: "👑 TITAN", score: base + 1200, boss: true },
      { name: "🔥 Sidy", score: base + 850 },
      { name: "⚡ Alpha", score: base + 620 },
      { name: "🧠 Aicha", score: base + 420 },
      { name: "🚀 Nova", score: base + 260 },
      { name: "💎 Kamoudou", score: base + 120 },
      { name: "🎯 Mariame", score: base - 40 },
      { name: "📚 Neo", score: base - 180 },
      { name: "🎮 Rookie", score: base - 320 },
    ].map((p) => ({
      ...p,
      score: Math.max(0, Math.round(p.score)),
    }));
  };

  const evolveScores = (players, stats, userScore) => {
    return players.map((player) => {
      if (player.name === "🟢 TOI") {
        return { ...player, score: userScore };
      }

      const pressure = userScore - player.score;

      let variation =
        Math.random() * 120 - 60 +
        pressure * 0.08 +
        stats.trend * 0.1 +
        stats.streak * 10;

      if (player.boss) variation *= 0.5;

      return {
        ...player,
        score: Math.max(0, Math.round(player.score + variation)),
      };
    });
  };

  const loadLeaderboard = async () => {
    try {
      const raw = await AsyncStorage.getItem("HISTORY");
      let history = parseHistory(raw);

      // 🔥 LIMITE AUX 25 DERNIÈRES PARTIES
      history = history.slice(-25);

      const stats = buildStatsFromHistory(history);
      const userScore = stats.best;

      const savedBoard = await AsyncStorage.getItem("LEADERBOARD_STATE");

      let aiPlayers = [];

      if (savedBoard) {
        try {
          const parsed = JSON.parse(savedBoard);
          aiPlayers = Array.isArray(parsed) ? parsed : [];
        } catch {
          aiPlayers = [];
        }
      }

      const defaultAIs = createAIPlayers(userScore);

      const aiMap = new Map();
      [...defaultAIs, ...aiPlayers].forEach((p) => {
        if (p?.name && p.name !== "🟢 TOI") {
          aiMap.set(p.name, {
            name: p.name,
            score: safeNumber(p.score),
            boss: !!p.boss,
          });
        }
      });

      aiPlayers = AI_NAMES.map((name) => {
        return (
          aiMap.get(name) ||
          defaultAIs.find((p) => p.name === name)
        );
      });

      aiPlayers = evolveScores(aiPlayers, stats, userScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, 9);

      const finalBoard = [
        ...aiPlayers,
        { name: "🟢 TOI", score: userScore, you: true },
      ].sort((a, b) => b.score - a.score);

      setData(finalBoard);

      await AsyncStorage.setItem(
        "LEADERBOARD_STATE",
        JSON.stringify(aiPlayers)
      );
    } catch (e) {
      console.log("LEADERBOARD ERROR:", e);
    }
  };

  const getRankStyle = (index) => {
    if (index === 0) return { color: "#FFD700" };
    if (index === 1) return { color: "#C0C0C0" };
    if (index === 2) return { color: "#CD7F32" };
    return { color: "white" };
  };

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        item.you && styles.youRow,
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
      <Text style={styles.title}>🏆 CLASSEMENT VIVANT</Text>

      {data.length === 0 ? (
        <Text style={styles.empty}>Chargement...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.name}-${index}`}
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
    alignItems: "center",
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
    width: 42,
  },
  name: {
    color: "white",
    fontSize: 16,
    flex: 1,
    paddingHorizontal: 10,
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