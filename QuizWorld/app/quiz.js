import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { QUESTIONS } from "../constants/questions";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
} from "react-native-google-mobile-ads";

const { width } = Dimensions.get("window");

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

export default function Quiz() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [money, setMoney] = useState(0);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(15);
  const [hearts, setHearts] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  const [combo, setCombo] = useState(1);
  const [streak, setStreak] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  const current = QUESTIONS[index];

  // 🔀 shuffle
  useEffect(() => {
    setShuffledOptions(shuffleArray(current.options));
  }, [index]);

  // 📊 progress anim
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (index + 1) / QUESTIONS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [index]);

  // ⏱ TIMER SAFE
  useEffect(() => {
    if (gameOver) return;

    if (time === 0) {
      loseLife();
      return;
    }

    if (time <= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }

    timerRef.current = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [time, gameOver]);

  // 📢 ADS
  useEffect(() => {
    interstitial.load();
  }, []);

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

  const loseLife = async () => {
    if (gameOver) return;

    await playSound("wrong");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    setCombo(1);
    setStreak(0);

    if (hearts - 1 <= 0) {
      setHearts(0);
      setGameOver(true);
    } else {
      setHearts((h) => h - 1);
      nextQuestion();
    }
  };

  const nextQuestion = () => {
    clearTimeout(timerRef.current);

    if (index + 1 < QUESTIONS.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setTime(15);
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    clearTimeout(timerRef.current);

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

    router.replace({ pathname: "/results", params: { money } });
  };

  const handleAnswer = (option) => {
    if (selected) return;

    setSelected(option);

    setTimeout(async () => {
      if (option === current.answer) {
        await playSound("correct");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newStreak = streak + 1;
        setStreak(newStreak);

        let newCombo = 1;
        if (newStreak >= 3) newCombo = 2;
        if (newStreak >= 6) newCombo = 3;
        if (newStreak >= 10) newCombo = 5;

        setCombo(newCombo);

        setMoney((m) => m + current.reward * newCombo);

        nextQuestion();
      } else {
        loseLife();
      }
    }, 400);
  };

  // ✅ CONTINUER SANS PUB (UX PRO)
  const revive = () => {
    setHearts(3);
    setGameOver(false);
    setTime(15);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const danger = time <= 5;

  // 💔 GAME OVER PRO DESIGN
  if (gameOver) {
    return (
      <View style={styles.overlay}>
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverIcon}>💔</Text>

          <Text style={styles.gameOverTitle}>
            Plus de vies
          </Text>

          <Text style={styles.gameOverSub}>
            Continue ou termine ta partie
          </Text>

          <TouchableOpacity
            style={styles.btnContinue}
            onPress={revive}
          >
            <Text style={styles.btnContinueText}>
              Continuer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnQuit}
            onPress={endGame}
          >
            <Text style={styles.btnQuitText}>
              Quitter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.hearts}>
          {"❤️".repeat(hearts) + "🖤".repeat(5 - hearts)}
        </Text>

        <Text style={styles.money}>💰 {money}</Text>

        <Animated.View
          style={[
            styles.timerCircle,
            danger && { backgroundColor: "#EF4444" },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.timerText}>{time}</Text>
        </Animated.View>
      </View>

      {/* COMBO */}
      <Text style={styles.combo}>🔥 x{combo} | {streak}</Text>

      {/* BARRE */}
      <View style={styles.progressBar}>
        <Animated.View
          style={[styles.progressFill, { width: progressWidth }]}
        />
      </View>

      {/* QUESTION */}
      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>
      </View>

      {/* OPTIONS */}
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
  container: { flex: 1, backgroundColor: "#0A0F2C", padding: 15 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hearts: { fontSize: 26 },

  money: { color: "#FFD700", fontWeight: "bold", fontSize: 18 },

  timerCircle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
  },

  timerText: { color: "white", fontWeight: "bold", fontSize: 18 },

  combo: {
    textAlign: "center",
    color: "#F59E0B",
    fontSize: 18,
    marginVertical: 8,
  },

  progressBar: {
    height: 10,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
  },

  card: {
    backgroundColor: "#1E3A8A",
    padding: 25,
    borderRadius: 20,
    marginVertical: 10,
  },

  question: {
    color: "white",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },

  option: {
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 20,
    marginVertical: 6,
    width: width * 0.95,
    alignSelf: "center",
  },

  optionText: {
    color: "white",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },

  correct: { backgroundColor: "#16A34A" },
  wrong: { backgroundColor: "#DC2626" },

  // 🎨 GAME OVER
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  gameOverCard: {
    backgroundColor: "#111827",
    padding: 30,
    borderRadius: 25,
    width: "85%",
    alignItems: "center",
  },

  gameOverIcon: { fontSize: 50 },

  gameOverTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  gameOverSub: {
    color: "#9CA3AF",
    marginBottom: 20,
  },

  btnContinue: {
    backgroundColor: "#22C55E",
    padding: 18,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },

  btnContinueText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  btnQuit: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },

  btnQuitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});