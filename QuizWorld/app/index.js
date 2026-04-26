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

  // évolution récente : positif si les dernières parties montent
  const trend = recentAverage - average;

  // streak = série d'amélioration ou de bonnes performances récentes
  let streak = 0;
  for (let i = scores.length - 1; i >= 1; i--) {
    if (scores[i] > scores[i - 1]) {
      streak += 1;
    } else {
      break;
    }
  }
  if (scores.length === 1 && scores[0] > 0) streak = 1;

  // stabilité : plus l’écart type est faible, plus le joueur est régulier
  const consistency = clamp(Math.round(180 - deviation * 0.4), 20, 180);

  // progression globale entre la première et la dernière partie
  const improvement = last - first;

  return {
    best,
    games,
    first,
    last,
    average,
    recentAverage,
    deviation,
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
      score: clamp(
        1300 + games * 18 + Math.max(0, trend) * 2 + streak * 30,
        200,
        99999
      ),
      boss: true,
    },
    {
      name: "🔥 AlphaX",
      score: clamp(1150 + average * 0.15 + consistency * 1.1, 150, 99999),
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
      score: clamp(20 + games * 6 - Math.max(0, trend) * 0.2, -1000, 99999),
    },
  ];

  const board = [
    ...aiPlayers,
    {
      name: "🟢 TOI",
      score: best,
      you: true,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return board;
};

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
      const history = parseHistory(raw).sort((a, b) => (a?.date || 0) - (b?.date || 0));

      const stats = buildStatsFromHistory(history);

      setBestScore(stats.best);
      setGamesPlayed(stats.games);
      setStreak(stats.streak);

      const board = generateSmartLeaderboard(stats);
      setLeaderboard(board);

      const bossScore = board.find((player) => player.boss)?.score ?? 0;
      const beatBoss = stats.best >= bossScore && stats.best > 0;

      await AsyncStorage.setItem("BOSS_BEAT", beatBoss ? "true" : "false");
      setBossBeaten(beatBoss);
    } catch (e) {
      console.log("LOAD ERROR:", e);
    }
  };

  // 🔥 REFRESH AUTO
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 💥 ADS SAFE
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

        {/* CLASSEMENT */}
        <View style={styles.leaderboardBox}>
          <Text style={styles.leaderboardTitle}>🏆 Classement vivant</Text>
          <Text style={styles.leaderboardSubtitle}>
            Les positions évoluent selon les performances réelles
          </Text>

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

        {/* BOSS */}
        {bossBeaten && (
          <View style={styles.bossBox}>
            <Text style={styles.bossText}>👑 TU AS BATTU LE BOSS !</Text>
          </View>
        )}

        {/* INFOS */}
        <View style={styles.infoBox}>
          <Text style={styles.info}>🔥 Monte dans le classement</Text>
          <Text style={styles.info}>⚔️ Bats le boss</Text>
          <Text style={styles.info}>👑 Deviens numéro 1</Text>
        </View>
      </ScrollView>

      {/* BANNER */}
      <View style={styles.banner}>
        <BannerAd
          unitId="ca-app-pub-5350081816144613/9386901047"
          size={BannerAdSize.BANNER}
        />
      </View>
    </View>
  );
}

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

  leaderboardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },

  leaderboardSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 12,
  },

  rowBase: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  row: {
    backgroundColor: "#111827",
  },

  goldRow: {
    backgroundColor: "#2A1E00",
  },

  silverRow: {
    backgroundColor: "#1C2330",
  },

  bronzeRow: {
    backgroundColor: "#2A1A10",
  },

  youRow: {
    backgroundColor: "#1E3A8A",
  },

  bossRow: {
    backgroundColor: "#7C3AED",
  },

  rankNum: {
    fontSize: 16,
    fontWeight: "bold",
    width: 42,
  },

  playerName: {
    color: "white",
    fontSize: 16,
    flex: 1,
    paddingHorizontal: 10,
  },

  score: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 16,
  },

  bossBox: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    width: "100%",
  },

  bossText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },

  infoBox: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },

  info: {
    color: "#E5E7EB",
  },

  banner: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#0A0F2C",
    paddingVertical: 5,
  },
});