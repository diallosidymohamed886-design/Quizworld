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

// 💥 PUB (SAFE)
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

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
      const board = await AsyncStorage.getItem("LEADERBOARD");

      setBestScore(best ? parseInt(best) : 0);
      setGamesPlayed(games ? parseInt(games) : 0);
      setStreak(streakData ? parseInt(streakData) : 0);
      setLeaderboard(board ? JSON.parse(board) : []);
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
      {/* 🌍 HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>🌍</Text>
        <Text style={styles.title}>QuizWorld</Text>
        <Text style={styles.subtitle}>
          Jusqu’où peux-tu aller ?
        </Text>
      </View>

      {/* 📊 STATS */}
      <View style={styles.statsBox}>
        <Text style={styles.stat}>🏆 {bestScore}</Text>
        <Text style={styles.stat}>🎮 {gamesPlayed} parties</Text>
        <Text style={styles.stat}>🔥 Streak: {streak}</Text>
        <Text style={styles.rank}>👑 {getRank()}</Text>
      </View>

      {/* 🎮 PLAY */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.playButton}
        onPress={() => router.replace("/quiz")}
      >
        <Text style={styles.playText}>JOUER</Text>
      </TouchableOpacity>

      {/* 🏆 CLASSEMENT */}
      <View style={styles.leaderboardBox}>
        <Text style={styles.leaderboardTitle}>🏆 Top joueurs</Text>

        {leaderboard.length === 0 ? (
          <Text style={styles.empty}>Aucun score encore</Text>
        ) : (
          leaderboard.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.rankNum}>#{index + 1}</Text>
              <Text style={styles.score}>{item.score}</Text>
            </View>
          ))
        )}
      </View>

      {/* 💡 INFOS */}
      <View style={styles.infoBox}>
        <Text style={styles.info}>🔥 Combo & multiplicateur</Text>
        <Text style={styles.info}>🧠 100+ questions</Text>
        <Text style={styles.info}>🏆 Monte dans le classement</Text>
      </View>

      {/* 📢 PUB */}
      <BannerAd
        unitId="ca-app-pub-5350081816144613/9386901047"
        size={BannerAdSize.BANNER}
      />
    </ScrollView>
  );
}

// 🎨 DESIGN PRO MAX
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

  logo: {
    fontSize: 70,
  },

  title: {
    fontSize: 42,
    color: "white",
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 5,
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

  // 🏆 LEADERBOARD
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

  rankNum: {
    color: "#9CA3AF",
    fontSize: 16,
  },

  score: {
    color: "#FFD700",
    fontWeight: "bold",
  },

  empty: {
    color: "#9CA3AF",
    textAlign: "center",
  },

  infoBox: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },

  info: {
    color: "#E5E7EB",
    fontSize: 16,
  },
});