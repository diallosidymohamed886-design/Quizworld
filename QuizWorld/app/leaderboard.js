import { useState, useCallback, useRef } from "react";
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

// 🔒 VALIDATE AI DATA
const isValidAI = (data) => {
  return (
    Array.isArray(data) &&
    data.length === AI_NAMES.length &&
    data.every(
      (p) =>
        typeof p?.name === "string" &&
        typeof p?.score === "number"
    )
  );
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
  const loadingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!loadingRef.current) {
        loadingRef.current = true;
        loadLeaderboard().finally(() => {
          loadingRef.current = false;
        });
      }
    }, [])
  );

  const createAIPlayers = (stats) => {
    const { best, games, average, recentAverage, streak } = stats;

    const skill = best * 0.5 + average * 0.3 + recentAverage * 0.4;

    return AI_NAMES.map((name, i) => {
      let base = skill + (9 - i) * 300;

      if (name === "👑 TITAN") {
        base += 1500 + games * 40 + streak * 80;
      }

      return {
        name,
        score: Math.round(clamp(base, 0, 999999)),
        boss: name === "👑 TITAN",
      };
    });
  };

  const evolveScores = (players, stats, userScore) => {
    return players.map((p) => {
      const pressure = userScore - p.score;

      let variation =
        Math.random() * 150 - 75 +
        pressure * 0.08 +
        stats.trend * 1.2 +
        stats.streak * 20;

      if (p.boss) variation *= 0.5;

      return {
        ...p,
        score: Math.round(Math.max(0, p.score + variation)),
      };
    });
  };

  const loadLeaderboard = async () => {
    try {
      const raw = await AsyncStorage.getItem("HISTORY");

      let history = parseHistory(raw)
        .sort((a, b) => (a?.date || 0) - (b?.date || 0))
        .slice(-25);

      const stats = buildStatsFromHistory(history);
      const userScore = stats.best;

      let saved = [];
      const savedRaw = await AsyncStorage.getItem("LEADERBOARD_STATE");

      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (isValidAI(parsed)) {
            saved = parsed;
          }
        } catch {}
      }

      let aiPlayers =
        saved.length > 0 ? saved : createAIPlayers(stats);

      aiPlayers = evolveScores(aiPlayers, stats, userScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, AI_NAMES.length);

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
      setData([]);
    }
  };

  const getRankStyle = (i) => {
    if (i === 0) return { color: "#FFD700" };
    if (i === 1) return { color: "#C0C0C0" };
    if (i === 2) return { color: "#CD7F32" };
    return { color: "white" };
  };

  const renderItem = ({ item, index }) => {
    if (!item) return null;

    return (
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

        <Text style={styles.score}>💰 {safeNumber(item.score)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 CLASSEMENT VIVANT</Text>

      {data.length === 0 ? (
        <Text style={styles.empty}>Chargement...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => `${item?.name || "x"}-${i}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

// 🎨 STYLES (inchangés)
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
  youRow: { backgroundColor: "#1E3A8A" },
  bossRow: { backgroundColor: "#7C3AED" },
  rank: { fontSize: 18, fontWeight: "bold", width: 42 },
  name: { color: "white", fontSize: 16, flex: 1, paddingHorizontal: 10 },
  score: { color: "#FFD700", fontSize: 18, fontWeight: "bold" },
  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});