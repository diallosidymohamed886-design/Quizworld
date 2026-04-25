import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Leaderboard() {
  const router = useRouter();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await AsyncStorage.getItem("LEADERBOARD");
      const parsed = data ? JSON.parse(data) : [];
      setScores(parsed);
    } catch {}
  };

  const getRankStyle = (index) => {
    if (index === 0) return { color: "#FFD700" }; // gold
    if (index === 1) return { color: "#C0C0C0" }; // silver
    if (index === 2) return { color: "#CD7F32" }; // bronze
    return { color: "white" };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 CLASSEMENT</Text>

      <FlatList
        data={scores}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.rank, getRankStyle(index)]}>
              #{index + 1}
            </Text>

            <Text style={styles.score}>💰 {item.score}</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },

  rank: {
    fontSize: 18,
    fontWeight: "bold",
  },

  score: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});