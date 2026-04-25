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

  // 💥 INTERSTITIAL (50% chance = UX safe)
  useEffect(() => {
    interstitial.load();

    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        if (Math.random() < 0.5) {
          try {
            interstitial.show();
          } catch {}
        }
      }
    );

    return unsubscribe;
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

  // 🧠 MESSAGE
  useEffect(() => {
    if (money < 200) setMessage("😅 Pas mal, mais tu peux mieux faire !");
    else if (money < 500) setMessage("🔥 Bien joué !");
    else if (money < 1000) setMessage("🚀 Très fort !");
    else setMessage("🏆 Niveau légende !");
  }, [money]);

  // 🎁 BONUS SAFE
  const getBonus = () => {
    rewarded.addAdEventListener(AdEventType.LOADED, () => {
      try {
        rewarded.show();
      } catch {}
    });

    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        router.replace("/quiz");
      }
    );

    rewarded.load();
  };

  return (
    <View style={styles.container}>
      {/* 🏆 TITLE */}
      <Text style={styles.title}>Résultat</Text>

      {/* 💰 SCORE */}
      <Text style={styles.score}>💰 {money}</Text>

      {/* 🧠 MESSAGE */}
      <Text style={styles.message}>{message}</Text>

      {/* 📊 STATS */}
      <View style={styles.statsBox}>
        <Text style={styles.stat}>🏆 Meilleur : {bestScore}</Text>
        <Text style={styles.stat}>🎮 Parties : {gamesPlayed}</Text>
      </View>

      {/* 🔘 BUTTONS */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Rejouer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rewardBtn} onPress={getBonus}>
          <Text style={styles.buttonText}>🎁 Bonus</Text>
        </TouchableOpacity>
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
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 34,
    fontWeight: "bold",
  },

  score: {
    fontSize: 50,
    color: "#FFD700",
    fontWeight: "bold",
  },

  message: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },

  statsBox: {
    alignItems: "center",
    gap: 5,
  },

  stat: {
    color: "#ccc",
    fontSize: 16,
  },

  buttons: {
    width: "100%",
    gap: 15,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },

  rewardBtn: {
    backgroundColor: "#F59E0B",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },

  banner: {
    marginTop: 10,
  },
});