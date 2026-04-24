import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

// 💥 Interstitial (rare)
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

// 🎁 Rewarded
const rewarded = RewardedAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Home() {
  const router = useRouter();
  const [showAd, setShowAd] = useState(false);

  // 💥 Charger interstitial (mais pas forcer)
  useEffect(() => {
    interstitial.load();

    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        // 🎯 30% de chance de montrer pub (UX safe)
        if (Math.random() < 0.3) {
          interstitial.show();
        }
      }
    );

    return unsubscribe;
  }, []);

  // 🎁 Bonus (rewarded)
  const handleBonus = () => {
    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        // 👉 ici tu peux donner bonus plus tard
        router.push("/quiz");
      }
    );

    rewarded.load();
    rewarded.show();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QuizWorld 🌍</Text>

      {/* 🎮 JOUER */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/quiz")}
      >
        <Text style={styles.text}>Jouer</Text>
      </TouchableOpacity>

      {/* 🎁 BONUS */}
      <TouchableOpacity style={styles.bonus} onPress={handleBonus}>
        <Text style={styles.text}>🎁 Jouer + Bonus</Text>
      </TouchableOpacity>

      {/* 📢 BANNER */}
      <View style={{ marginTop: 30 }}>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0F2C",
  },

  title: {
    fontSize: 32,
    color: "white",
    marginBottom: 30,
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "#FFD700",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: 200,
    alignItems: "center",
  },

  bonus: {
    backgroundColor: "#F59E0B",
    padding: 15,
    borderRadius: 15,
    width: 200,
    alignItems: "center",
  },

  text: {
    fontWeight: "bold",
  },
});