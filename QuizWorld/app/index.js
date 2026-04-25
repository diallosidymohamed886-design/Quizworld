import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
} from "react-native-google-mobile-ads";

// 💥 Interstitial
const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Home() {
  const router = useRouter();

  // 💥 Charger pub intelligemment
  useEffect(() => {
    interstitial.load();

    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        // 🎯 30% de chance
        if (Math.random() < 0.3) {
          try {
            interstitial.show();
          } catch {}
        }
      }
    );

    return unsubscribe;
  }, []);

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

      {/* 📢 BANNER */}
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
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#0A0F2C",
    padding: 20,
  },

  title: {
    fontSize: 42,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },

  button: {
    backgroundColor: "#FFD700",
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 20,
    alignItems: "center",
  },

  text: {
    fontSize: 20,
    fontWeight: "bold",
  },

  banner: {
    marginBottom: 10,
  },
});