import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { QUESTIONS } from "../constants/questions";
import { Audio } from "expo-av";

export default function Quiz() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [money, setMoney] = useState(0);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(15);
  const [hiddenOptions, setHiddenOptions] = useState([]);

  const current = QUESTIONS[index];

  // 🔊 SOUND
  const playSound = async (type) => {
    const sound = new Audio.Sound();
    try {
      if (type === "correct") {
        await sound.loadAsync(require("../assets/sounds/correct.mp3"));
      } else {
        await sound.loadAsync(require("../assets/sounds/wrong.mp3"));
      }
      await sound.playAsync();
    } catch (error) {}
  };

  // ⏱ TIMER
  useEffect(() => {
    if (time === 0) {
      router.push({ pathname: "/results", params: { money } });
      return;
    }

    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  // 🎯 ANSWER
  const handleAnswer = (option) => {
    if (selected) return;

    setSelected(option);

    setTimeout(async () => {
      if (option === current.answer) {
        await playSound("correct");

        const newMoney = money + current.reward;
        setMoney(newMoney);

        if (index + 1 < QUESTIONS.length) {
          setIndex(index + 1);
          setSelected(null);
          setTime(15);
          setHiddenOptions([]);
        } else {
          router.push({ pathname: "/results", params: { money: newMoney } });
        }
      } else {
        await playSound("wrong");
        router.push({ pathname: "/results", params: { money } });
      }
    }, 800);
  };

  // 💡 50/50
  const useFiftyFifty = () => {
    const wrongOptions = current.options.filter(
      (opt) => opt !== current.answer
    );

    const removed = wrongOptions.slice(0, 2);
    setHiddenOptions(removed);
  };

  return (
    <View style={styles.container}>
      {/* 💰 MONEY */}
      <View style={styles.moneyBox}>
        <Text style={styles.money}>${money}</Text>
      </View>

      {/* 📊 PROGRESSION */}
      <Text style={styles.progress}>
        Question {index + 1} / {QUESTIONS.length}
      </Text>

      {/* ⏱ TIMER */}
      <Text style={styles.timer}>⏱ {time}s</Text>

      {/* QUESTION */}
      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>
      </View>

      {/* OPTIONS */}
      {current.options.map((opt) => {
        if (hiddenOptions.includes(opt)) return null;

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

      {/* 💡 JOKER */}
      <TouchableOpacity style={styles.joker} onPress={useFiftyFifty}>
        <Text style={{ color: "white" }}>💡 50/50</Text>
      </TouchableOpacity>
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
    alignSelf: "center"
  },

  money: {
    fontSize: 22,
    fontWeight: "bold"
  },

  progress: {
    color: "white",
    textAlign: "center",
    marginTop: 10
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
    marginBottom: 20
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
    marginVertical: 6
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
  },

  joker: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#9333EA",
    padding: 10,
    borderRadius: 20
  }
});