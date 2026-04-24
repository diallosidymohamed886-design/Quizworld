import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { QUESTIONS } from "../constants/questions";

export default function Quiz() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [money, setMoney] = useState(0);

  const current = QUESTIONS[index];

  const handleAnswer = (option) => {
    if (option === current.answer) {
      const newMoney = money + current.reward;
      setMoney(newMoney);

      if (index + 1 < QUESTIONS.length) {
        setIndex(index + 1);
      } else {
        router.push({ pathname: "/results", params: { money: newMoney } });
      }
    } else {
      router.push({ pathname: "/results", params: { money } });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.money}>💰 ${money}</Text>

      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>
      </View>

      {current.options.map((opt) => (
        <TouchableOpacity key={opt} style={styles.option} onPress={() => handleAnswer(opt)}>
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0A0F2C" },
  money: { color: "#FFD700", fontSize: 28, textAlign: "center", marginBottom: 20 },
  card: { backgroundColor: "#1E3A8A", padding: 20, borderRadius: 20, marginBottom: 20 },
  question: { color: "white", fontSize: 18, textAlign: "center" },
  option: { backgroundColor: "#2563EB", padding: 15, borderRadius: 15, marginVertical: 5 },
  optionText: { color: "white", textAlign: "center" }
});