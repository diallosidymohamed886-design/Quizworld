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
    }, 500);
  };

  // 🎁 REVIVE SAFE (fix crash + memory leak)
  const revive = () => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      AdEventType.LOADED,
      () => {
        rewarded.show();
      }
    );

    const unsubscribeReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setHearts(5);
        setGameOver(false);
      }
    );

    rewarded.load();

    // 🔥 nettoyage listeners
    setTimeout(() => {
      unsubscribeLoaded();
      unsubscribeReward();
    }, 5000);
  };

  const renderHearts = () =>
    "❤️".repeat(hearts) + "🖤".repeat(5 - hearts);

  // 💔 GAME OVER
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
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <Text style={styles.hearts}>{renderHearts()}</Text>

        <View style={styles.scoreBox}>
          <Text style={styles.money}>${money}</Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{time}s</Text>
        </View>
      </View>

      {/* 📊 PROGRESSION */}
      <Text style={styles.progress}>
        Question {index + 1}/{QUESTIONS.length}
      </Text>

      {/* 💎 QUESTION */}
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <Text style={styles.question}>{current.question}</Text>
        </View>
      </View>

      {/* 🎮 OPTIONS */}
      <View style={styles.optionsContainer}>
        {shuffledOptions.map((opt) => (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.8}
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

      {/* 📢 PUB */}
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
    backgroundColor: "#0A0F2C",
    padding: 15,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hearts: {
    fontSize: 26,
  },

  scoreBox: {
    backgroundColor: "#111827",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },

  money: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },

  timerBox: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },

  timer: {
    color: "white",
    fontWeight: "bold",
  },

  progress: {
    color: "#9CA3AF",
    textAlign: "center",
  },

  cardShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
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
    gap: 12,
  },

  option: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },

  optionText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },

  correct: {
    backgroundColor: "#16A34A",
  },

  wrong: {
    backgroundColor: "#DC2626",
  },

  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "#0A0F2C",
  },

  gameOver: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },

  rewardBtn: {
    backgroundColor: "#F59E0B",
    padding: 18,
    borderRadius: 20,
    width: 240,
    alignItems: "center",
  },

  quitBtn: {
    backgroundColor: "#EF4444",
    padding: 18,
    borderRadius: 20,
    width: 240,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});