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

  // 💥 INTERSTITIAL (UX SAFE)
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
    const loadStats = async () => {
      try {
        const best = await AsyncStorage.getItem("BEST_SCORE");
        const games = await AsyncStorage.getItem("GAMES_PLAYED");

        setBestScore(best ? parseInt(best) : 0);
        setGamesPlayed(games ? parseInt(games) : 0);
      } catch {}
    };

    loadStats();
  }, []);

  // 🧠 MESSAGE
  useEffect(() => {
    if (money < 200) setMessage("😅 Continue, tu progresses !");
    else if (money < 500) setMessage("🔥 Bien joué !");
    else if (money < 1000) setMessage("🚀 Très fort !");
    else setMessage("🏆 Tu es une légende !");
  }, [money]);

  // 🎁 BONUS SAFE
  const getBonus = () => {
    const unsubLoaded = rewarded.addAdEventListener(
      AdEventType.LOADED,
      () => {
        rewarded.show();
      }
    );

    const unsubReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        router.replace("/quiz");
      }
    );

    rewarded.load();

    setTimeout(() => {
      unsubLoaded();
      unsubReward();
    }, 5000);
  };

  return (
    <View style={styles.container}>
      {/* 🏆 HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Résultat</Text>
        <Text style={styles.score}>💰 {money}</Text>
      </View>

      {/* 🧠 MESSAGE */}
      <Text style={styles.message}>{message}</Text>

      {/* 📊 STATS */}
      <View style={styles.statsBox}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Meilleur</Text>
          <Text style={styles.statValue}>{bestScore}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Parties</Text>
          <Text style={styles.statValue}>{gamesPlayed}</Text>
        </View>
      </View>

      {/* 🔘 ACTIONS */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Rejouer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonBonus} onPress={getBonus}>
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
    justifyContent: "space-between",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginTop: 30,
  },

  title: {
    color: "#9CA3AF",
    fontSize: 18,
  },

  score: {
    fontSize: 60,
    color: "#FFD700",
    fontWeight: "bold",
    marginTop: 10,
  },

  message: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
  },

  statsBox: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  statCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    width: 130,
  },

  statLabel: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  statValue: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  buttons: {
    gap: 15,
  },

  buttonPrimary: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },

  buttonBonus: {
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
    alignItems: "center",
    marginBottom: 10,
  },
});