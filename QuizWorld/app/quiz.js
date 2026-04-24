import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { QUESTIONS } from "../constants/questions";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

const rewarded = RewardedAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

export default function Quiz() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [money, setMoney] = useState(0);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(15);
  const [hearts, setHearts] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  const current = QUESTIONS[index];

  useEffect(() => {
    setShuffledOptions(shuffleArray(current.options));
  }, [index]);

  const playSound = async (type) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        type === "correct"
          ? require("../assets/sounds/correct.mp3")
          : require("../assets/sounds/wrong.mp3")
      );
      await sound.playAsync();
    } catch {}
  };

  useEffect(() => {
    if (time === 0) {
      loseLife();
      return;
    }
    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    interstitial.load();
    rewarded.load();
  }, []);

  const loseLife = async () => {
    await playSound("wrong");

    if (hearts - 1 <= 0) {
      setHearts(0);
      setGameOver(true);
    } else {
      setHearts((h) => h - 1);
      nextQuestion();
    }
  };

  const nextQuestion = () => {
    if (index + 1 < QUESTIONS.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setTime(15);
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    try {
      interstitial.show();
    } catch {}

    try {
      const best = await AsyncStorage.getItem("BEST_SCORE");
      const games = await AsyncStorage.getItem("GAMES_PLAYED");

      const newBest =
        !best || money > parseInt(best) ? money : parseInt(best);

      await AsyncStorage.setItem("BEST_SCORE", newBest.toString());
      await AsyncStorage.setItem(
        "GAMES_PLAYED",
        ((games ? parseInt(games) : 0) + 1).toString()
      );
    } catch {}

    router.push({ pathname: "/results", params: { money } });
  };

  const handleAnswer = (option) => {
    if (selected) return;

    setSelected(option);

    setTimeout(async () => {
      if (option === current.answer) {
        await playSound("correct");
        setMoney((m) => m + current.reward);
        nextQuestion();
      } else {
        loseLife();
      }
    }, 700);
  };

  const revive = () => {
    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setHearts(5);
        setGameOver(false);
      }
    );

    rewarded.load();
    rewarded.show();
  };

  const renderHearts = () =>
    "❤️".repeat(hearts) + "🖤".repeat(5 - hearts);

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.gameOver}>💔 Plus de vies</Text>

        <TouchableOpacity style={styles.rewardBtn} onPress={revive}>
          <Text style={styles.btnText}>🎁 Continuer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quitBtn} onPress={endGame}>
          <Text style={styles.btnText}>Quitter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hearts}>{renderHearts()}</Text>
      <Text style={styles.money}>💰 ${money}</Text>
      <Text style={styles.timer}>⏱ {time}s</Text>

      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>
      </View>

      {shuffledOptions.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => handleAnswer(opt)}
          style={[
            styles.option,
            selected === opt &&
              (opt === current.answer
                ? styles.correct
                : styles.wrong),
          ]}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}

      <BannerAd
        unitId="ca-app-pub-5350081816144613/9386901047"
        size={BannerAdSize.BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0A0F2C" },
  hearts: { fontSize: 24, textAlign: "center" },
  money: { color: "#FFD700", fontSize: 22, textAlign: "center" },
  timer: { color: "white", textAlign: "center" },
  card: { backgroundColor: "#1E3A8A", padding: 25, borderRadius: 25 },
  question: { color: "white", textAlign: "center" },
  option: { backgroundColor: "#2563EB", padding: 15, borderRadius: 25, margin: 5 },
  optionText: { color: "white", textAlign: "center" },
  correct: { backgroundColor: "green" },
  wrong: { backgroundColor: "red" },
  gameOver: { color: "white", fontSize: 24, textAlign: "center" },
  rewardBtn: { backgroundColor: "#F59E0B", padding: 15, borderRadius: 20 },
  quitBtn: { backgroundColor: "#EF4444", padding: 15, borderRadius: 20 },
  btnText: { color: "white", textAlign: "center" },
});