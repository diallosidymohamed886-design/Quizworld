import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const money = Number(params.money) || 0;

  const [bestScore, setBestScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [message, setMessage] = useState("");

  // 🔥 LOAD STATS
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem("HISTORY");

        let history = [];
        try {
          history = raw ? JSON.parse(raw) : [];
        } catch {
          history = [];
        }

        if (!Array.isArray(history)) history = [];

        setGamesPlayed(history.length);

        const best = history.length
          ? Math.max(...history.map((h) => h.score || 0))
          : 0;

        setBestScore(best);
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, []);

  // 🧠 MESSAGE
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

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 24,
    marginBottom: 10,
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
  },

  stat: {
    color: "#9CA3AF",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    marginTop: 20,
  },

  button2: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 20,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});