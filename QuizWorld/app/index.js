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

// 💥 Interstitial
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

// 🎁 Rewarded
const rewarded = RewardedAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Home() {
  const router = useRouter();

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  // 🔥 LOAD STATS
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const best = await AsyncStorage.getItem("BEST_SCORE");
      const games = await AsyncStorage.getItem("GAMES_PLAYED");

      setBestScore(best ? parseInt(best) : 0);
      setGamesPlayed(games ? parseInt(games) : 0);
    } catch {}
  };

  // 💥 PUB intelligente
  useEffect(() => {
    interstitial.load();

    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        if (Math.random() < 0.3) {
          try {
            interstitial.show();
          } catch {}
        }
      }
    );

    return unsubscribe;
  }, []);

  // 🎁 BONUS JOURNALIER
  const getDailyBonus = () => {
    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        const bonus = 200;

        const best = await AsyncStorage.getItem("BEST_SCORE");
        const newBest =
          !best || bonus > parseInt(best) ? bonus : parseInt(best);

        await AsyncStorage.setItem("BEST_SCORE", newBest.toString());

        loadStats();
      }
    );

    rewarded.load();
    rewarded.show();
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

      {/* 🏆 STATS */}
      <View style={styles.statsBox}>
        <Text style={styles.stat}>🏆 Meilleur : {bestScore}</Text>
        <Text style={styles.stat}>🎮 Parties : {gamesPlayed}</Text>
      </View>

      {/* 🎮 PLAY */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.playButton}
        onPress={() => router.push("/quiz")}
      >
        <Text style={styles.playText}>JOUER</Text>
      </TouchableOpacity>

      {/* 🎁 BONUS */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.bonusButton}
        onPress={getDailyBonus}
      >
        <Text style={styles.bonusText}>
          🎁 Récompense du jour
        </Text>
      </TouchableOpacity>

      {/* 📊 INFOS */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>🔥 Combo & Streak</Text>
        <Text style={styles.infoText}>🧠 100+ questions</Text>
        <Text style={styles.infoText}>🏆 Défie ton record</Text>
      </View>

      {/* 📢 PUB */}
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
    flex: 1,
    backgroundColor: "#0A0F2C",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
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
  },

  stat: {
    color: "#E5E7EB",
    fontSize: 16,
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

  bonusButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 25,
  },

  bonusText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  infoBox: {
    alignItems: "center",
    gap: 6,
  },

  infoText: {
    color: "#E5E7EB",
  },

  banner: {
    marginBottom: 10,
  },
});