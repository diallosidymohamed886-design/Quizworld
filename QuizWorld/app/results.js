import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

const rewarded = RewardedAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Results() {
  const { money } = useLocalSearchParams();
  const router = useRouter();

  const [message, setMessage] = useState("");

  // 💥 INTERSTITIAL (1 seule fois)
  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        interstitial.show();
      }
    );

    interstitial.load();

    return unsubscribe;
  }, []);

  // 🧠 MESSAGE DYNAMIQUE
  useEffect(() => {
    if (money < 200) setMessage("😅 Pas mal, mais tu peux mieux faire !");
    else if (money < 500) setMessage("🔥 Bien joué !");
    else setMessage("🏆 Excellent, tu es un pro !");
  }, [money]);

  // 🎁 REWARD BONUS
  const getBonus = () => {
    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        router.push("/quiz"); // rejouer direct
      }
    );

    rewarded.load();
    rewarded.show();
  };

  return (
    <View style={styles.container}>
      {/* 💰 SCORE */}
      <Text style={styles.title}>Résultat</Text>

      <Text style={styles.score}>💰 {money}</Text>

      <Text style={styles.message}>{message}</Text>

      {/* 🔁 REJOUER */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>Rejouer</Text>
      </TouchableOpacity>

      {/* 🎁 BONUS PUB */}
      <TouchableOpacity style={styles.rewardBtn} onPress={getBonus}>
        <Text style={styles.buttonText}>
          🎁 Rejouer + Bonus (pub)
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

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },

  rewardBtn: {
    backgroundColor: "#F59E0B",
    padding: 15,
    borderRadius: 20,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});