import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
} from "react-native-google-mobile-ads";

const { width } = Dimensions.get("window");

const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

// ================= UTILS =================
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
  const first = scores[0] || 0;
  const last = scores[scores.length - 1] || 0;

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
    streak,
    average,
    recentAverage,
    trend,
    consistency,
    improvement,
  };
};

// ================= COMPONENT =================
export default function Home() {
  const router = useRouter();

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [bossBeaten, setBossBeaten] = useState(false);

  const loadData = async () => {
    try {
      const raw = await AsyncStorage.getItem("HISTORY");

      // 🔥 LIMIT 25 + ORDER
      let history = parseHistory(raw)
        .sort((a, b) => (a?.date || 0) - (b?.date || 0))
        .slice(-25);

      const stats = buildStatsFromHistory(history);

      setBestScore(stats.best);
      setGamesPlayed(stats.games);
      setStreak(stats.streak);

      // 🔥 SYNC AVEC LEADERBOARD
      let board;
      const saved = await AsyncStorage.getItem("LEADERBOARD_STATE");

      if (saved) {
        try {
          const aiPlayers = JSON.parse(saved);

          board = [
            ...aiPlayers,
            { name: "🟢 TOI", score: stats.best, you: true },
          ].sort((a, b) => b.score - a.score);
        } catch {
          board = [];
        }
      }

      // fallback si aucun leaderboard
      if (!board || board.length === 0) {
        board = [
          { name: "👑 TITAN", score: 1200, boss: true },
          { name: "🔥 Alpha", score: 900 },
          { name: "⚡ Nova", score: 700 },
          { name: "🟢 TOI", score: stats.best, you: true },
        ].sort((a, b) => b.score - a.score);
      }

      setLeaderboard(board);

      const bossScore = board.find((p) => p.boss)?.score ?? 0;
      const beatBoss = stats.best >= bossScore && stats.best > 0;

      await AsyncStorage.setItem("BOSS_BEAT", beatBoss ? "true" : "false");
      setBossBeaten(beatBoss);
    } catch (e) {
      console.log("LOAD ERROR:", e);
    }
  };

  // 🔄 REFRESH
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 📢 ADS
  useFocusEffect(
    useCallback(() => {
      interstitial.load();

      const unsub = interstitial.addAdEventListener(
        AdEventType.LOADED,
        () => {
          if (Math.random() < 0.2) {
            try {
              interstitial.show();
            } catch {}
          }
        }
      );

      return () => unsub();
    }, [])
  );

  const getRank = () => {
    if (bestScore < 500) return "Débutant";
    if (bestScore < 1500) return "Pro";
    return "Légende";
  };

  const getRowStyle = (player, index) => {
    if (player.boss) return styles.bossRow;
    if (player.you) return styles.youRow;

    if (index === 0) return styles.goldRow;
    if (index === 1) return styles.silverRow;
    if (index === 2) return styles.bronzeRow;

    return styles.row;
  };

  const getRankColor = (index) => {
    if (index === 0) return { color: "#FFD700" };
    if (index === 1) return { color: "#C0C0C0" };
    if (index === 2) return { color: "#CD7F32" };
    return { color: "#9CA3AF" };
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0F2C" }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌍</Text>
          <Text style={styles.title}>QuizWorld</Text>
          <Text style={styles.subtitle}>Classement vivant et intelligent</Text>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push("/profile")}
          >
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsBox}>
          <Text style={styles.stat}>🏆 {bestScore}</Text>
          <Text style={styles.stat}>🎮 {gamesPlayed} parties</Text>
          <Text style={styles.stat}>🔥 Streak: {streak}</Text>
          <Text style={styles.rank}>👑 {getRank()}</Text>
        </View>

        {/* PLAY */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.replace("/quiz")}
        >
          <Text style={styles.playText}>JOUER</Text>
        </TouchableOpacity>

        {/* LEADERBOARD */}
        <View style={styles.leaderboardBox}>
          <Text style={styles.leaderboardTitle}>🏆 Classement vivant</Text>

          {leaderboard.map((player, index) => (
            <View
              key={`${player.name}-${index}`}
              style={[
                styles.rowBase,
                getRowStyle(player, index),
              ]}
            >
              <Text style={[styles.rankNum, getRankColor(index)]}>
                #{index + 1}
              </Text>

              <Text style={styles.playerName}>{player.name}</Text>

              <Text style={styles.score}>{player.score}</Text>
            </View>
          ))}
        </View>

        {bossBeaten && (
          <View style={styles.bossBox}>
            <Text style={styles.bossText}>👑 TU AS BATTU LE BOSS !</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.banner}>
        <BannerAd
          unitId="ca-app-pub-5350081816144613/9386901047"
          size={BannerAdSize.BANNER}
        />
      </View>
    </View>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 80,
  },

  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },

  profileBtn: {
    position: "absolute",
    right: 0,
    top: 0,
  },

  logo: { fontSize: 70 },

  title: {
    fontSize: 42,
    color: "white",
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 4,
  },

  statsBox: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },

  stat: {
    color: "#E5E7EB",
    fontSize: 18,
  },

  rank: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
  },

  playButton: {
    backgroundColor: "#FFD700",
    width: width * 0.9,
    paddingVertical: 24,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },

  playText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },

  leaderboardBox: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  rowBase: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  goldRow: { backgroundColor: "#2A1E00" },
  silverRow: { backgroundColor: "#1C2330" },
  bronzeRow: { backgroundColor: "#2A1A10" },
  youRow: { backgroundColor: "#1E3A8A" },
  bossRow: { backgroundColor: "#7C3AED" },

  rankNum: {
    width: 40,
    fontWeight: "bold",
    color: "#FFD700",
  },

  playerName: {
    flex: 1,
    color: "white",
  },

  score: {
    color: "#FFD700",
    fontWeight: "bold",
  },

  bossBox: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 15,
  },

  bossText: {
    color: "white",
    textAlign: "center",
  },

  banner: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
  },
});