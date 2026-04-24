import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { QUESTIONS } from "../constants/questions";

export default function Quiz() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [money, setMoney] = useState(0);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(15);

  const current = QUESTIONS[index];

  // TIMER
  useEffect(() => {
    if (time === 0) {
      router.push({ pathname: "/results", params: { money } });
      return;
    }

    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  const handleAnswer = (option) => {
    if (selected) return;

    setSelected(option);

    setTimeout(() => {
      if (option === current.answer) {
        const newMoney = money + current.reward;
        setMoney(newMoney);

        if (index + 1 < QUESTIONS.length) {
          setIndex(index + 1);
          setSelected(null);
          setTime(15);
        } else {
          router.push({ pathname: "/results", params: { money: newMoney } });
        }
      } else {
        router.push({ pathname: "/results", params: { money } });
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* 💰 MONEY */}
      <View style={styles.moneyBox}>
        <Text style={styles.money}>${money}</Text>
      </View>

      {/* ⏱ TIMER */}
      <Text style={styles.timer}>⏱ {time}s</Text>

      {/* QUESTION */}
      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>
      </View>

      {/* OPTIONS */}
      {current.options.map((opt) => {
        const isCorrect = opt === current.answer;
        const isSelected = opt === selected;

        return (
          <TouchableOpacity
            key={opt}
            onPress={() => handleAnswer(opt)}
            style={[
              styles.option,
              isSelected &&
                (isCorrect ? styles.correct : styles.wrong)
            ]}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0A0F2C"
  },

  moneyBox: {
    backgroundColor: "#FFD700",
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 10
  },

  money: {
    fontSize: 22,
    fontWeight: "bold"
  },

  timer: {
    color: "white",
    textAlign: "center",
    marginBottom: 10
  },

  card: {
    backgroundColor: "#1E3A8A",
    padding: 25,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 10
  },

  question: {
    color: "white",
    fontSize: 18,
    textAlign: "center"
  },

  option: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 25,
    marginVertical: 6,
    elevation: 5
  },

  optionText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold"
  },

  correct: {
    backgroundColor: "green"
  },

  wrong: {
    backgroundColor: "red"
  }
});