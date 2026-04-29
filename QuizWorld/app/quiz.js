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

const interstitial = InterstitialAd.createForAdRequest(
  "ca-app-pub-5350081816144613/1045376590"
);

// 🔀 SHUFFLE
const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Quiz() {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [money, setMoney] = useState(0);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(15);
  const [hearts, setHearts] = useState(5);
  const [gameOver, setGameOver] = useState(false);

  const [combo, setCombo] = useState(1);
  const [streak, setStreak] = useState(0);

  const [questions, setQuestions] = useState(() => shuffleArray(QUESTIONS));
  const [shuffledOptions, setShuffledOptions] = useState([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const isEnding = useRef(false);
  const soundRef = useRef(null);
  const reviveUsedRef = useRef(false);
  const answerLockRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const moneyRef = useRef(0);

  const safeIndex =
    questions.length > 0 ? Math.min(index, questions.length - 1) : 0;

  const current = questions[safeIndex];

  const isReady =
    Array.isArray(questions) &&
    questions.length > 0 &&
    current &&
    Array.isArray(current.options);

  useEffect(() => {
    moneyRef.current = money;
  }, [money]);

  // 🔀 Shuffle options
  useEffect(() => {
    if (!isReady) return;
    setShuffledOptions(shuffleArray(current.options));
  }, [isReady, current, index]);

  // 📊 Progression
  useEffect(() => {
    if (!isReady) return;

    Animated.timing(progressAnim, {
      toValue: (index + 1) / questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [index, isReady, questions.length, progressAnim]);

  // ⏱ TIMER stable
  useEffect(() => {
    if (!isReady || gameOver || isEnding.current || selected) return;

    clearTimeout(timerRef.current);

    if (time <= 0) {
      if (!timeoutHandledRef.current) {
        timeoutHandledRef.current = true;
        loseLife();
      }
      return;
    }

    if (time <= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    timerRef.current = setTimeout(() => {
      setTime((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [time, gameOver, selected, isReady, index, scaleAnim]);

  // CLEANUP
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync?.().catch(() => {});
      }
    };
  }, []);

  // PUB
  useEffect(() => {
    interstitial.load();
  }, []);

  // 🔊 SON
  const playSound = async (type) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const source =
        type === "correct"
          ? require("../assets/sounds/correct.mp3")
          : require("../assets/sounds/wrong.mp3");

      const { sound } = await Audio.Sound.createAsync(source);
      soundRef.current = sound;

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status?.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch {}
  };

  // 💔 PERTE DE VIE
  const loseLife = async () => {
    if (gameOver || isEnding.current || answerLockRef.current) return;

    clearTimeout(timerRef.current);
    answerLockRef.current = true;

    try {
      await playSound("wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}

    setCombo(1);
    setStreak(0);
    setSelected(null);

    if (hearts <= 1) {
      setHearts(0);
      setGameOver(true);
      answerLockRef.current = false;
    } else {
      setHearts((h) => h - 1);
      answerLockRef.current = false;
      nextQuestion();
    }
  };

  // ➡️ NEXT
  const nextQuestion = () => {
    clearTimeout(timerRef.current);
    timeoutHandledRef.current = false;
    answerLockRef.current = false;

    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setTime(15);
    } else {
      endGame();
    }
  };

  // 💾 HISTORY
  const saveHistory = async () => {
    try {
      const data = await AsyncStorage.getItem("HISTORY");

      let history = [];
      try {
        history = data ? JSON.parse(data) : [];
      } catch {
        history = [];
      }

      if (!Array.isArray(history)) history = [];

      history.push({
        score: Number(moneyRef.current) || 0,
        date: Date.now(),
      });

      history = history.sort((a, b) => b.date - a.date).slice(0, 25);

      await AsyncStorage.setItem("HISTORY", JSON.stringify(history));
    } catch {}
  };

  // 🏁 END
  const endGame = async () => {
    if (isEnding.current) return;
    isEnding.current = true;

    clearTimeout(timerRef.current);
    timeoutHandledRef.current = false;
    answerLockRef.current = false;

    try {
      if (Math.random() < 0.4) interstitial.show();
    } catch {}

    await saveHistory();

    router.replace({
      pathname: "/results",
      params: { money: Number(moneyRef.current) || 0 },
    });
  };

  // 🎯 ANSWER
  const handleAnswer = (option) => {
    if (selected || isEnding.current || answerLockRef.current) return;

    setSelected(option);
    answerLockRef.current = true;
    clearTimeout(timerRef.current);

    setTimeout(async () => {
      if (option === current?.answer) {
        try {
          await playSound("correct");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}

        const newStreak = streak + 1;
        setStreak(newStreak);

        let newCombo = 1;
        if (newStreak >= 3) newCombo = 2;
        if (newStreak >= 6) newCombo = 3;
        if (newStreak >= 10) newCombo = 5;

        setCombo(newCombo);

        const reward = (current?.reward || 0) * newCombo;
        const nextMoney = Number(moneyRef.current) + reward;
        moneyRef.current = nextMoney;
        setMoney(nextMoney);

        answerLockRef.current = false;
        nextQuestion();
      } else {
        answerLockRef.current = false;
        loseLife();
      }
    }, 300);
  };

  // 🔥 REVIVE FIX
  const revive = () => {
    if (reviveUsedRef.current) return;
    reviveUsedRef.current = true;

    clearTimeout(timerRef.current);
    isEnding.current = false;
    answerLockRef.current = false;
    timeoutHandledRef.current = false;

    setGameOver(false);
    setHearts(3);
    setSelected(null);
    setTime(15);

    setIndex(0);
    setQuestions(shuffleArray(QUESTIONS));

    const revivedMoney = Math.floor(Number(moneyRef.current) * 0.5);
    moneyRef.current = revivedMoney;
    setMoney(revivedMoney);

    setCombo(1);
    setStreak(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const danger = time <= 5;

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.overlay}>
        <View style={styles.cardGameOver}>
          <Text style={styles.bigIcon}>💔</Text>
          <Text style={styles.title}>Plus de vies</Text>

          {!reviveUsedRef.current ? (
            <TouchableOpacity style={styles.btnGreen} onPress={revive}>
              <Text style={styles.btnText}>Continuer</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.btnGreen, styles.btnDisabled]}>
              <Text style={styles.btnText}>Reprise déjà utilisée</Text>
            </View>
          )}

          <TouchableOpacity style={styles.btnRed} onPress={endGame}>
            <Text style={styles.btnText}>Quitter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.header}>
          <Text style={styles.hearts}>
            {"❤️".repeat(hearts) + "🖤".repeat(5 - hearts)}
          </Text>

          <Text style={styles.money}>💰 {money}</Text>

          <Animated.View
            style={[
              styles.timer,
              danger && { backgroundColor: "#EF4444" },
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.timerText}>{time}</Text>
          </Animated.View>
        </View>

        <Text style={styles.combo}>🔥 x{combo} | {streak}</Text>

        <View style={styles.progress}>
          <Animated.View style={[styles.fill, { width: progressWidth }]} />
        </View>

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
                (opt === current.answer ? styles.correct : styles.wrong),
            ]}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.banner}>
        <BannerAd
          unitId="ca-app-pub-5350081816144613/9386901047"
          size={BannerAdSize.BANNER}
        />
      </View>
    </View>
  );
}

// 🎨 STYLES COMPLETS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F2C" },
  top: { flex: 1, padding: 15, justifyContent: "center" },
  banner: { alignItems: "center", marginBottom: 5 },

  header: { flexDirection: "row", justifyContent: "space-between" },
  hearts: { fontSize: 26 },
  money: { color: "#FFD700", fontSize: 20, fontWeight: "bold" },

  timer: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
  },

  timerText: { color: "white", fontWeight: "bold" },

  combo: {
    textAlign: "center",
    color: "#F59E0B",
    marginVertical: 8,
  },

  progress: {
    height: 10,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    overflow: "hidden",
  },

  fill: {
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

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  cardGameOver: {
    backgroundColor: "#111827",
    padding: 30,
    borderRadius: 25,
    width: "85%",
    alignItems: "center",
  },

  bigIcon: { fontSize: 50 },

  title: {
    color: "white",
    fontSize: 24,
    marginBottom: 20,
  },

  btnGreen: {
    backgroundColor: "#22C55E",
    padding: 18,
    borderRadius: 20,
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },

  btnDisabled: {
    backgroundColor: "#4B5563",
  },

  btnRed: {
    backgroundColor: "#EF4444",
    padding: 18,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
  },

  loading: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});