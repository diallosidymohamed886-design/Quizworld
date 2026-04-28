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

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const safeNumber = (v) => {
  const n = Number(v);
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

// 🔥 STATS
const buildStatsFromHistory = (history) => {
  const scores = history.map((h) => safeNumber(h?.score));

  const best = scores.length ? Math.max(...scores) : 0;
  const games = scores.length;
  const average =
    scores.length > 0
      ? scores.reduce((s, n) => s + n, 0) / scores.length
      : 0;

  const recent = scores.slice(-5);
  const recentAverage =
    recent.length > 0
      ? recent.reduce((s, n) => s + n, 0) / recent.length
      : 0;

  const trend = recentAverage - average;

  let streak = 0;
  for (let i = scores.length - 1; i >= 1; i--) {
    if (scores[i] > scores[i - 1]) streak++;
    else break;
  }

  return { best, games, average, recentAverage, trend, streak };
};

export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  // 🔥 IA ULTRA AMÉLIORÉE
  const createAIPlayers = (stats) => {
    const { best, games, average, recentAverage, streak } = stats;

    const skill = best * 0.6 + average * 0.3 + recentAverage * 0.5;

    return [
      {
        name: "👑 TITAN",
        score: clamp(
          skill * 1.4 + 2000 + games * 50 + streak * 120,
          1000,
          999999
        ),
        boss: true,
      },
      {
        name: "🔥 Sidy",
        score: skill * 1.2 + 1200 + games * 25,
      },
      {
        name: "⚡ Alpha",
        score: skill * 1.1 + 900 + recentAverage * 0.6,
      },
      {
        name: "🧠 Aicha",
        score: skill * 1.05 + 700,
      },
      {
        name: "🚀 Nova",
        score: skill * 0.95 + streak * 200,
      },
      {
        name: "💎 Kamoudou",
        score: skill * 0.9 + average * 0.4,
      },
      {
        name: "🎯 Mariame",
        score: skill * 0.85 + games * 30,
      },
      {
        name: "📚 Neo",
        score: skill * 0.75 + games * 40,
      },
      {
        name: "🎮 Rookie",
        score: skill * 0.5 + 100,
      },
    ].map((p) => ({
      ...p,
      score: Math.round(Math.max(0, p.score)),
    }));
  };

  // 🔥 ÉVOLUTION DYNAMIQUE
  const evolveScores = (players, stats, userScore) => {
    return players.map((p) => {
      if (p.name === "🟢 TOI") return p;

      const pressure = userScore - p.score;

      let variation =
        Math.random() * 300 - 150 +
        pressure * 0.15 +
        stats.trend * 2 +
        stats.streak * 40;

      if (p.boss) variation *= 0.6;

      return {
        ...p,
        score: Math.round(Math.max(0, p.score + variation)),
      };
    });
  };

  const loadLeaderboard = async () => {
    try {
      const raw = await AsyncStorage.getItem("HISTORY");
      let history = parseHistory(raw).slice(-25);

      const stats = buildStatsFromHistory(history);
      const userScore = stats.best;

      let saved = [];
      const savedRaw = await AsyncStorage.getItem("LEADERBOARD_STATE");

      if (savedRaw) {
        try {
          saved = JSON.parse(savedRaw);
        } catch {}
      }

      let aiPlayers = createAIPlayers(stats);

      if (saved.length) {
        aiPlayers = saved;
      }

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

  const getRankStyle = (i) => {
    if (i === 0) return { color: "#FFD700" };
    if (i === 1) return { color: "#C0C0C0" };
    if (i === 2) return { color: "#CD7F32" };
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
          keyExtractor={(item, i) => `${item.name}-${i}`}
          renderItem={renderItem}
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