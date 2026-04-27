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

// ================== UTILS (IDENTIQUE HOME) ==================
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

const getMean = (scores) => {
  if (!scores.length) return 0;
  return scores.reduce((sum, n) => sum + n, 0) / scores.length;
};

const getStdDev = (scores) => {
  if (!scores.length) return 0;
  const mean = getMean(scores);
  const variance =
    scores.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
};

const buildStatsFromHistory = (history) => {
  const scores = history.map((item) => safeNumber(item?.score));
  const best = scores.length ? Math.max(...scores) : 0;
  const games = scores.length;
  const first = scores.length ? scores[0] : 0;
  const last = scores.length ? scores[scores.length - 1] : 0;
  const average = getMean(scores);
  const recentScores = scores.slice(-5);
  const recentAverage = getMean(recentScores);
  const deviation = getStdDev(scores);

  const trend = recentAverage - average;

  let streak = 0;
  for (let i = scores.length - 1; i >= 1; i--) {
    if (scores[i] > scores[i - 1]) streak++;
    else break;
  }

  const consistency = clamp(Math.round(180 - deviation * 0.4), 20, 180);
  const improvement = last - first;

  return {
    best,
    games,
    last,
    average,
    recentAverage,
    trend,
    streak,
    consistency,
    improvement,
  };
};

const generateSmartLeaderboard = (stats) => {
  const {
    best,
    games,
    last,
    average,
    recentAverage,
    trend,
    streak,
    consistency,
    improvement,
  } = stats;

  const aiPlayers = [
    {
      name: "👑 TITAN",
      score: clamp(1300 + games * 18 + trend * 2 + streak * 30, 200, 99999),
      boss: true,
    },
    {
      name: "🔥 AlphaX",
      score: clamp(1150 + average * 0.15 + consistency, 150, 99999),
    },
    {
      name: "⚡ BrainMax",
      score: clamp(980 + recentAverage * 0.18 + games * 12, 100, 99999),
    },
    {
      name: "🧠 Aicha",
      score: clamp(820 + trend * 1.5 + last * 0.08, 80, 99999),
    },
    {
      name: "🚀 Nova",
      score: clamp(650 + streak * 45 + improvement * 0.1, 50, 99999),
    },
    {
      name: "💎 Kamoudou",
      score: clamp(500 + consistency * 0.8, 20, 99999),
    },
    {
      name: "🎯 Mariame",
      score: clamp(320 + improvement * 0.05 + games * 14, 0, 99999),
    },
    {
      name: "📚 Neo",
      score: clamp(180 + games * 20 + average * 0.08, 0, 99999),
    },
    {
      name: "🎮 Rookie",
      score: clamp(20 + games * 6 - trend * 0.2, -1000, 99999),
    },
  ];

  return [
    ...aiPlayers,
    { name: "🟢 TOI", score: best, you: true },
  ].sort((a, b) => b.score - a.score);
};

// ================== COMPONENT ==================
export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  const loadLeaderboard = async () => {
    try {
      const raw = await AsyncStorage.getItem("HISTORY");
      const history = parseHistory(raw);

      const stats = buildStatsFromHistory(history);
      const board = generateSmartLeaderboard(stats);

      setData(board);
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
      <Text style={styles.title}>🏆 CLASSEMENT GLOBAL</Text>

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

// ================== STYLES ==================
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