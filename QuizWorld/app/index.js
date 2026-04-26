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

  // 🔥 REFRESH À CHAQUE RETOUR
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 🧠 CLASSEMENT INTELLIGENT
  const generateSmartLeaderboard = (userScore) => {
    const base = Math.max(userScore, 300);

    const ai = [
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

    const all = [...ai, { name: "🟢 TOI", score: userScore }];

    return all.sort((a, b) => b.score - a.score);
  };

  const loadData = async () => {
    try {
      const historyData = await AsyncStorage.getItem("HISTORY");
      const history = historyData ? JSON.parse(historyData) : [];

      const best = Math.max(...history.map((h) => h.score), 0);
      const games = history.length;

      // 🔥 STREAK CALCUL
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

      // 👑 BOSS
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

  // 💥 ADS
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

          {leaderboard.map((p, i) => (
            <View
              key={i}
              style={[
                styles.row,
                p.name === "🟢 TOI" && styles.youRow,
                p.boss && styles.bossRow,
              ]}
            >
              <Text style={styles.rankNum}>#{i + 1}</Text>
              <Text style={styles.playerName}>{p.name}</Text>
              <Text style={styles.score}>{p.score}</Text>
            </View>
          ))}
        </View>

        {bossBeaten && (
          <View style={styles.bossBox}>
            <Text style={styles.bossText}>
              👑 TU AS BATTU LE BOSS !
            </Text>
          </View>
        )}
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