import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

// 💥 Interstitial
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

// 🎁 Rewarded
const rewarded = RewardedAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Results() {
  const { money } = useLocalSearchParams();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  // 💥 INTERSTITIAL SAFE (1 seule fois)
  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        try {
          interstitial.show();
        } catch {}
      }
    );

    interstitial.load();

    return () => {
      unsubscribe();
    };
  }, []);

  // 💾 LOAD STATS
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

  // 🧠 MESSAGE DYNAMIQUE
  useEffect(() => {
    if (money < 200) setMessage("😅 Pas mal, mais tu peux mieux faire !");
    else if (money < 500) setMessage("🔥 Bien joué !");
    else if (money < 1000) setMessage("🚀 Très fort !");
    else setMessage("🏆 Niveau légende !");
  }, [money]);

  // 🎁 REWARD BONUS (SAFE)
  const getBonus = () => {
    const unsubscribe = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        router.replace("/quiz");
      }
    );

    rewarded.load();
    rewarded.show();

    // nettoyage
    setTimeout(() => {
      unsubscribe();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* 💰 SCORE */}
      <Text style={styles.title}>Résultat</Text>

      <Text style={styles.score}>💰 {money}</Text>

      <Text style={styles.message}>{message}</Text>

      {/* 📊 STATS */}
      <Text style={styles.stat}>🏆 Meilleur : {bestScore}</Text>
      <Text style={styles.stat}>🎮 Parties : {gamesPlayed}</Text>

      {/* 🔁 REJOUER */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Rejouer</Text>
      </TouchableOpacity>

      {/* 🎁 BONUS PUB */}
      <TouchableOpacity style={styles.rewardBtn} onPress={getBonus}>
        <Text style={styles.buttonText}>
          🎁 Rejouer + Bonus
        </Text>
      </TouchableOpacity>

      {/* 📢 BANNER */}
      <View style={{ marginTop: 20 }}>
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
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 26,
    marginBottom: 10,
  },

  score: {
    fontSize: 40,
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 10,
  },

  message: {
    color: "white",
    marginBottom: 20,
  },

  stat: {
    color: "#ccc",
    marginBottom: 5,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    width: 200,
    alignItems: "center",
  },

  rewardBtn: {
    backgroundColor: "#F59E0B",
    padding: 15,
    borderRadius: 20,
    width: 200,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});