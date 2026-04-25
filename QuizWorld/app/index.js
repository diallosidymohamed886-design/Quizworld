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

  return (
    <View style={styles.container}>
      {/* 🌍 LOGO / TITLE */}
      <View style={styles.header}>
        <Text style={styles.logo}>🌍</Text>
        <Text style={styles.title}>QuizWorld</Text>
        <Text style={styles.subtitle}>
          Teste ton intelligence et bats ton record
        </Text>
      </View>

      {/* 🎮 PLAY BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.playButton}
        onPress={() => router.push("/quiz")}
      >
        <Text style={styles.playText}>JOUER</Text>
      </TouchableOpacity>

      {/* 📊 MINI INFO */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>🔥 Mode rapide</Text>
        <Text style={styles.infoText}>🧠 Culture générale</Text>
        <Text style={styles.infoText}>🏆 Score max à battre</Text>
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

  // 🔝 HEADER
  header: {
    alignItems: "center",
    marginTop: 40,
  },

  logo: {
    fontSize: 50,
    marginBottom: 10,
  },

  title: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    marginTop: 5,
    fontSize: 14,
    textAlign: "center",
  },

  // 🎮 BUTTON
  playButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 22,
    paddingHorizontal: 80,
    borderRadius: 30,

    shadowColor: "#FFD700",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },

  playText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },

  // 📊 INFOS
  infoBox: {
    alignItems: "center",
    gap: 8,
  },

  infoText: {
    color: "#E5E7EB",
    fontSize: 14,
  },

  // 📢 PUB
  banner: {
    marginBottom: 10,
  },
});