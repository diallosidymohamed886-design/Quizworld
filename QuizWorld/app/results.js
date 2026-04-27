import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
} from "react-native-google-mobile-ads";

const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Results() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // 🔒 SAFE MONEY
  const money = Number(params.money) || 0;

  const [message, setMessage] = useState("");
  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false); // 🔥 NEW

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  // 🎬 ANIMATIONS
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();

    Animated.sequence([
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 💥 ADS SAFE
  useEffect(() => {
    let mounted = true;

    const unsub = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        if (mounted && Math.random() < 0.35) {
          try {
            interstitial.show();
          } catch {}
        }
      }
    );

    interstitial.load();

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // 💾 LOAD STATS (SOURCE UNIQUE = HISTORY)
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await AsyncStorage.getItem("HISTORY");

        let history = [];
        try {
          history = data ? JSON.parse(data) : [];
        } catch {
          history = [];
        }

        if (!Array.isArray(history)) history = [];

        const games = history.length;
        setGamesPlayed(games);

        const best = history.length
          ? Math.max(...history.map((h) => h.score || 0))
          : 0;

        setBestScore(best);

        // 🔥 NEW RECORD DETECTION
        if (money > best) {
          setIsNewRecord(true);
        }

      } catch (e) {
        console.log("RESULT ERROR:", e);
      }
    };

    loadStats();
  }, []);

  // 🧠 MESSAGE INTELLIGENT
  useEffect(() => {
    if (money === 0) {
      setMessage("😅 Essaie encore !");
    } else if (money < 200) {
      setMessage("📈 Tu progresses !");
    } else if (money < 500) {
      setMessage("🔥 Bon niveau !");
    } else if (money < 1000) {
      setMessage("🚀 Très fort !");
    } else if (money < 2000) {
      setMessage("💎 Elite !");
    } else {
      setMessage("👑 LÉGENDE VIVANTE !");
    }
  }, [money]);

  const scoreScale = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.container}>
      
      <View style={styles.content}>
        
        {/* HEADER */}
        <Animated.View
          style={[
            styles.header,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.title}>RÉSULTAT</Text>

          <Animated.Text
            style={[
              styles.score,
              { transform: [{ scale: scoreScale }] },
            ]}
          >
            💰 {money}
          </Animated.Text>
        </Animated.View>

        {/* 🔥 NEW RECORD */}
        {isNewRecord && (
          <Text style={styles.newRecord}>🎉 NOUVEAU RECORD !</Text>
        )}

        {/* MESSAGE */}
        <Text style={styles.message}>{message}</Text>

        {/* STATS */}
        <View style={styles.statsBox}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>🏆 Meilleur</Text>
            <Text style={styles.statValue}>{bestScore}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>🎮 Parties</Text>
            <Text style={styles.statValue}>{gamesPlayed}</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.buttonPrimary}
          onPress={() => router.replace("/quiz")}
        >
          <Text style={styles.buttonText}>REJOUER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Accueil</Text>
        </TouchableOpacity>

      </View>

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
    backgroundColor: "#0A0F2C",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    color: "#6B7280",
    fontSize: 14,
    letterSpacing: 2,
  },

  score: {
    fontSize: 72,
    color: "#FFD700",
    fontWeight: "bold",
    marginTop: 10,
  },

  newRecord: {
    color: "#22C55E",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  message: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    marginVertical: 20,
    fontWeight: "600",
  },

  statsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    width: "48%",
  },

  statLabel: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  statValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5,
  },

  buttonPrimary: {
    backgroundColor: "#2563EB",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
  },

  buttonSecondary: {
    backgroundColor: "#374151",
    padding: 15,
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