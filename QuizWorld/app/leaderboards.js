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

const buildStatsFromHistory = (history) => {
  const scores = history.map((item) => safeNumber(item?.score));
  const best = scores.length ? Math.max(...scores) : 0;
  const games = scores.length;
  const first = scores.length ? scores[0] : 0;
  const last = scores.length ? scores[scores.length - 1] : 0;
  const average = scores.length
    ? scores.reduce((sum, n) => sum + n, 0) / scores.length
    : 0;

  const recentScores = scores.slice(-5);
  const recentAverage = recentScores.length
    ? recentScores.reduce((sum, n) => sum + n, 0) / recentScores.length
    : 0;

  let streak = 0;
  for (let i = scores.length - 1; i >= 1; i--) {
    if (scores[i] > scores[i - 1]) streak += 1;
    else break;
  }
  if (scores.length === 1 && scores[0] > 0) streak = 1;

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

      const roleMultiplier = player.boss
        ? 0.35
        : player.name === "🎮 Rookie"
          ? 1.35
          : player.name === "📚 Neo"
            ? 1.2
            : 1;

      const pressure = userScore - player.score;
      const performanceBoost =
        stats.streak * 8 +
        stats.trend * 0.08 +
        stats.improvement * 0.02 +
        stats.recentAverage * 0.01;

      const baseVariation =
        (Math.random() * 140 - 70) * roleMultiplier +
        pressure * 0.08 +
        performanceBoost;

      let nextScore = player.score + baseVariation;

      if (player.boss) {
        nextScore += stats.games * 6;
      }

      if (player.name === "👑 TITAN") {
        nextScore += 40 + stats.best * 0.03;
      }

      if (player.name === "🔥 Sidy") {
        nextScore += stats.average * 0.04;
      }

      if (player.name === "⚡ Alpha") {
        nextScore += stats.recentAverage * 0.05;
      }

      if (player.name === "🧠 Aicha") {
        nextScore += stats.trend * 0.12;
      }

      if (player.name === "🚀 Nova") {
        nextScore += stats.streak * 18;
      }

      if (player.name === "💎 Kamoudou") {
        nextScore += stats.average * 0.02;
      }

      if (player.name === "🎯 Mariame") {
        nextScore += stats.improvement * 0.03;
      }

      if (player.name === "📚 Neo") {
        nextScore += stats.games * 10;
      }

      if (player.name === "🎮 Rookie") {
        nextScore -= Math.max(0, stats.trend) * 0.1;
      }

      return {
        ...player,
        score: Math.max(0, Math.round(nextScore)),
      };
    });
  };

  const loadLeaderboard = async () => {
    try {
      const historyData = await AsyncStorage.getItem("HISTORY");
      const history = parseHistory(historyData);

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
      [...defaultAIs, ...aiPlayers].forEach((player) => {
        if (player?.name && player.name !== "🟢 TOI") {
          if (!aiMap.has(player.name)) {
            aiMap.set(player.name, {
              name: player.name,
              score: safeNumber(player.score),
              boss: !!player.boss,
            });
          }
        }
      });

      aiPlayers = AI_NAMES.map((name) => {
        const existing = aiMap.get(name);
        return (
          existing || defaultAIs.find((p) => p.name === name) || {
            name,
            score: 0,
          }
        );
      });

      aiPlayers = evolveScores(aiPlayers, stats, userScore);

      aiPlayers = aiPlayers
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
      <Text style={[styles.rank, getRankStyle(index)]}>#{index + 1}</Text>

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