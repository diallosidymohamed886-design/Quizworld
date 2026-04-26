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

export default function Home() {
  const router = useRouter();

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [bossBeaten, setBossBeaten] = useState(false);

  // 🔥 REFRESH AUTO (IMPORTANT)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 🧠 CLASSEMENT INTELLIGENT
  const generateSmartLeaderboard = (userScore) => {
    const base = Math.max(userScore, 300);

    const aiPlayers = [
      { name: "👑 TITAN", score: base + 1200, boss: true },
      { name: "🔥 AlphaX", score: base + 800 },
      { name: "⚡ BrainMax", score: base + 500 },
      { name: "🧠 Aicha", score: base + 300 },
      { name: "🚀 Nova", score: base + 150 },
      { name: "💎 Kamoudou", score: base + 50 },
      { name: "🎯 Mariame", score: base - 100 },
      { name: "📚 Neo", score: base - 250 },
      { name: "🎮 Rookie", score: base - 400 },
    ];

    const allPlayers = [
      ...aiPlayers,
      { name: "🟢 TOI", score: userScore },
    ];

    return allPlayers.sort((a, b) => b.score - a.score);
  };

  // 🧠 LOAD DATA PRO
  const loadData = async () => {
    try {
      const historyData = await AsyncStorage.getItem("HISTORY");
      const history = historyData ? JSON.parse(historyData) : [];

      // ✅ BEST SCORE
      const best = history.length
        ? Math.max(...history.map((h) => h.score))
        : 0;

      // ✅ GAMES
      const games = history.length;

      // ✅ STREAK INTELLIGENT
      let currentStreak = 0;
      for (let i = history.length - 1; i > 0; i--) {
        if (history[i].score > history[i - 1].score) {
          currentStreak++;
        } else break;
      }

      setBestScore(best);
      setGamesPlayed(games);
      setStreak(currentStreak);

      const board = generateSmartLeaderboard(best);

      // 👑 BOSS CHECK
      if (best >= board[0].score) {
        await AsyncStorage.setItem("BOSS_BEAT", "true");
        setBossBeaten(true);
      } else {
        const boss = await AsyncStorage.getItem("BOSS_BEAT");
        setBossBeaten(boss === "true");
      }

      setLeaderboard(board);
    } catch (e) {
      console.log(e);
    }
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0F2C" }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌍</Text>
          <Text style={styles.title}>QuizWorld</Text>
          <Text style={styles.subtitle}>
            Deviens le meilleur joueur
          </Text>

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
          <Text style={styles.leaderboardTitle}>
            🏆 Classement intelligent
          </Text>

          {leaderboard.map((player, index) => (
            <View
              key={index}
              style={[
                styles.row,
                player.name === "🟢 TOI" && styles.youRow,
                player.boss && styles.bossRow,
              ]}
            >
              <Text style={styles.rankNum}>#{index + 1}</Text>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.score}>{player.score}</Text>
            </View>
          ))}
        </View>

        {/* BOSS MESSAGE */}
        {bossBeaten && (
          <View style={styles.bossBox}>
            <Text style={styles.bossText}>
              👑 TU AS BATTU LE BOSS !
            </Text>
          </View>
        )}

        {/* INFOS */}
        <View style={styles.infoBox}>
          <Text style={styles.info}>🔥 Monte dans le classement</Text>
          <Text style={styles.info}>⚔️ Bats le boss</Text>
          <Text style={styles.info}>👑 Deviens numéro 1</Text>
        </View>
      </ScrollView>

      {/* BANNER FIX */}
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
  bossRow: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  rankNum: { color: "#9CA3AF" },
  playerName: { color: "white" },
  score: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  bossBox: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
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
  info: { color: "#E5E7EB" },
  banner: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#0A0F2C",
    paddingVertical: 5,
  },
});