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
  AdEventType,
} from "react-native-google-mobile-ads";

// 🔀 Shuffle
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

  // 🔊 SOUND
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

  // ⏱ TIMER
  useEffect(() => {
    if (time === 0) {
      loseLife();
      return;
    }

    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  // 📢 LOAD ADS
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
      if (Math.random() < 0.5) interstitial.show();
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
    }, 600);
  };

  // 🎁 REVIVE SAFE
  const revive = () => {
    rewarded.addAdEventListener(
      AdEventType.LOADED,
      () => {
        rewarded.show();
      }
    );

    rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setHearts(5);
        setGameOver(false);
      }
    );

    rewarded.load();
  };

  const renderHearts = () =>
    "❤️".repeat(hearts) + "🖤".repeat(5 - hearts);

  // 💔 GAME OVER UI
  if (gameOver) {
    return (
      <View style={styles.containerCenter}>
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
      {/* HEADER */}
      <View style={styles.top}>
        <Text style={styles.hearts}>{renderHearts()}</Text>
        <Text style={styles.money}>💰 ${money}</Text>
        <Text style={styles.timer}>⏱ {time}s</Text>
      </View>

      {/* QUESTION */}
      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>
      </View>

      {/* OPTIONS */}
      <View style={styles.optionsContainer}>
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
      </View>

      {/* PUB */}
      <BannerAd
        unitId="ca-app-pub-5350081816144613/9386901047"
        size={BannerAdSize.BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#0A0F2C",
    justifyContent: "space-between",
  },

  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "#0A0F2C",
  },

  top: {
    alignItems: "center",
    gap: 5,
  },

  hearts: {
    fontSize: 28,
  },

  money: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "bold",
  },

  timer: {
    color: "white",
    fontSize: 18,
  },

  card: {
    backgroundColor: "#1E3A8A",
    padding: 25,
    borderRadius: 25,
  },

  question: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },

  optionsContainer: {
    gap: 10,
  },

  option: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 20,
  },

  optionText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },

  correct: {
    backgroundColor: "#16A34A",
  },

  wrong: {
    backgroundColor: "#DC2626",
  },

  gameOver: {
    color: "white",
    fontSize: 28,
    marginBottom: 20,
  },

  rewardBtn: {
    backgroundColor: "#F59E0B",
    padding: 18,
    borderRadius: 20,
    width: 220,
    alignItems: "center",
  },

  quitBtn: {
    backgroundColor: "#EF4444",
    padding: 18,
    borderRadius: 20,
    width: 220,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});