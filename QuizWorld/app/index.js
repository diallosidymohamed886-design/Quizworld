import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
} from "react-native-google-mobile-ads";

const { width } = Dimensions.get("window");

// 💥 PUB SAFE
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

// 🧠 JOUEURS IA (OPTIMISÉS)
const AI_PLAYERS = [
  { name: "🔥 AlphaX", score: 5000 },
  { name: "👑 KingQuiz", score: 4200 },
  { name: "⚡ BrainMax", score: 3500 },
  { name: "🧠 GeniusPro", score: 2800 },
  { name: "🚀 SpeedMind", score: 2200 },
  { name: "💎 ElitePlayer", score: 1700 },
  { name: "🎯 SharpIQ", score: 1300 },
  { name: "📚 SmartOne", score: 900 },
  { name: "🎮 RookieX", score: 500 },
];

export default function Home() {
  const router = useRouter();

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // 🔥 LOAD DATA
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const best = await AsyncStorage.getItem("BEST_SCORE");
      const games = await AsyncStorage.getItem("GAMES_PLAYED");
      const streakData = await AsyncStorage.getItem("STREAK");

      const userScore = best ? parseInt(best) : 0;

      setBestScore(userScore);
      setGamesPlayed(games ? parseInt(games) : 0);
      setStreak(streakData ? parseInt(streakData) : 0);

      // 🧠 CREATION CLASSEMENT HYBRIDE
      const merged = [
        ...AI_PLAYERS,
        { name: "🟢 TOI", score: userScore },
      ];

      const sorted = merged.sort((a, b) => b.score - a.score);

      setLeaderboard(sorted);
    } catch {}
  };

  // 💥 INTERSTITIAL SAFE
  useEffect(() => {
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
  }, []);

  // 🏆 RANK
  const getRank = () => {
    if (bestScore < 500) return "Débutant";
    if (bestScore < 1500) return "Pro";
    return "Légende";
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>🌍</Text>
        <Text style={styles.title}>QuizWorld</Text>
        <Text style={styles.subtitle}>
          Deviens le meilleur joueur
        </Text>
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
        activeOpacity={0.85}
        style={styles.playButton}
        onPress={() => router.replace("/quiz")}
      >
        <Text style={styles.playText}>JOUER</Text>
      </TouchableOpacity>

      {/* 🏆 CLASSEMENT */}
      <View style={styles.leaderboardBox}>
        <Text style={styles.leaderboardTitle}>
          🏆 Classement mondial
        </Text>

        {leaderboard.slice(0, 10).map((player, index) => (
          <View
            key={index}
            style={[
              styles.row,
              player.name === "🟢 TOI" && styles.youRow,
            ]}
          >
            <Text style={styles.rankNum}>#{index + 1}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.score}>{player.score}</Text>
          </View>
        ))}
      </View>

      {/* INFOS */}
      <View style={styles.infoBox}>
        <Text style={styles.info}>🔥 Monte dans le classement</Text>
        <Text style={styles.info}>🧠 Bats les meilleurs</Text>
        <Text style={styles.info}>👑 Deviens numéro 1</Text>
      </View>

      {/* PUB */}
      <BannerAd
        unitId="ca-app-pub-5350081816144613/9386901047"
        size={BannerAdSize.BANNER}
      />
    </ScrollView>
  );
}

// 🎨 DESIGN PRO
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#0A0F2C",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
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

  stat: { color: "#E5E7EB", fontSize: 18 },

  rank: {
    color: "#FFD700",
    fontWeight: "bold",
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
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  youRow: {
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  rankNum: { color: "#9CA3AF" },

  playerName: { color: "white" },

  score: {
    color: "#FFD700",
    fontWeight: "bold",
  },

  infoBox: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },

  info: { color: "#E5E7EB" },
});