import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QuizWorld 🌍</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/quiz")}
      >
        <Text style={styles.text}>Jouer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0F2C" },
  title: { fontSize: 30, color: "white", marginBottom: 20 },
  button: { backgroundColor: "#FFD700", padding: 15, borderRadius: 10 },
  text: { fontWeight: "bold" }
});