import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from "react-native-google-mobile-ads";

// 💥 PUB
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

const rewarded = RewardedAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Home() {
  const router = useRouter();

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [streak, setStreak] = useState(0);

  // 🔥 LOAD DATA
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const best = await AsyncStorage.getItem("BEST_SCORE");
      const games = await AsyncStorage.getItem("GAMES_PLAYED");
      const streakData = await AsyncStorage.getItem("STREAK");

      setBestScore(best ? parseInt(best) : 0);
      setGamesPlayed(games ? parseInt(games) : 0);
      setStreak(streakData ? parseInt(streakData) : 0);
    } catch {}
  };

  // 🔥 INTERSTITIAL (safe)
  useEffect(() => {
    interstitial.load();

    const unsub = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        if (Math.random() < 0.25) {
          try {
            interstitial.show();
          } catch {}
        }
      }
    );

    return unsub;
  }, []);

  // 🎁 COFFRE QUOTIDIEN
  const openChest = () => {
    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        const reward = 300;

        const newBest =
          reward > bestScore ? reward : bestScore;

        await AsyncStorage.setItem("BEST_SCORE", newBest.toString());

        // 🔥 STREAK +1
        const newStreak = streak + 1;
        setStreak(newStreak);
        await AsyncStorage.setItem("STREAK", newStreak.toString());

        loadData();
      }
    );

    rewarded.load();
    rewarded.show();
  };

  // 🏆 RANG
  const getRank = () => {
    if (bestScore < 500) return "Débutant";
    if (bestScore < 1500) return "Pro";
    return "Légende";
  };

  return (
    <View style={styles.container}>
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
        onPress={() => router.push("/quiz")}
      >
        <Text style={styles.playText}>JOUER</Text>
      </TouchableOpacity>

      {/* 🎁 COFFRE */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.chest}
        onPress={openChest}
      >
        <Text style={styles.chestText}>🎁 Coffre quotidien</Text>
      </TouchableOpacity>

      {/* 💡 INFOS */}
      <View style={styles.infoBox}>
        <Text style={styles.info}>🔥 Combo & multiplicateur</Text>
        <Text style={styles.info}>🧠 100+ questions</Text>
        <Text style={styles.info}>🏆 Deviens une légende</Text>
      </View>

      {/* 📢 PUB */}
      <BannerAd
        unitId="ca-app-pub-5350081816144613/9386901047"
        size={BannerAdSize.BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginTop: 30,
  },

  logo: {
    fontSize: 50,
  },

  title: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    marginTop: 5,
  },

  statsBox: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    gap: 5,
  },

  stat: {
    color: "#E5E7EB",
    fontSize: 16,
  },

  rank: {
    color: "#FFD700",
    fontWeight: "bold",
  },

  playButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 22,
    paddingHorizontal: 80,
    borderRadius: 30,
    elevation: 10,
  },

  playText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },

  chest: {
    backgroundColor: "#F59E0B",
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 25,
  },

  chestText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  infoBox: {
    alignItems: "center",
    gap: 6,
  },

  info: {
    color: "#E5E7EB",
    fontSize: 14,
  },
});