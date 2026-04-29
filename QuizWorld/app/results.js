import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ================= UTILS =================
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const parseHistory = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 🔒 SAFE MONEY
  const money = safeNumber(params?.money);

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [message, setMessage] = useState("...");

  // 🔥 LOAD STATS
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem("HISTORY");

        let history = parseHistory(raw)
          .sort((a, b) => (a?.date || 0) - (b?.date || 0))
          .slice(-25);

        const scores = history.map((h) => safeNumber(h?.score));

        setGamesPlayed(scores.length);

        const best = scores.length ? Math.max(...scores) : 0;
        setBestScore(best);
      } catch (e) {
        console.log("RESULTS ERROR:", e);
        setBestScore(0);
        setGamesPlayed(0);
      }
    };

    load();
  }, []);

  // 🧠 MESSAGE SAFE
  useEffect(() => {
    if (money < 200) setMessage("😅 Continue !");
    else if (money < 500) setMessage("🔥 Bon !");
    else if (money < 1000) setMessage("🚀 Très fort !");
    else if (money < 2000) setMessage("💎 Élites !");
    else setMessage("👑 LÉGENDE !");
  }, [money]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RÉSULTAT</Text>

      <Text style={styles.score}>💰 {money}</Text>

      <Text style={styles.message}>{message}</Text>

      <Text style={styles.stat}>🏆 Meilleur : {bestScore}</Text>
      <Text style={styles.stat}>🎮 Parties : {gamesPlayed}</Text>

      {/* 🔥 FIX NAVIGATION */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>REJOUER</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button2}
        onPress={() => router.push("/leaderboard")}
      >
        <Text style={styles.buttonText}>Voir classement</Text>
      </TouchableOpacity>
    </View>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
  },

  score: {
    fontSize: 60,
    color: "#FFD700",
    fontWeight: "bold",
  },

  message: {
    color: "white",
    fontSize: 18,
    marginVertical: 15,
    textAlign: "center",
  },

  stat: {
    color: "#9CA3AF",
    marginTop: 5,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    marginTop: 20,
    width: "80%",
    alignItems: "center",
  },

  button2: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 20,
    marginTop: 10,
    width: "80%",
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});