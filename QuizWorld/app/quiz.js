import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { QUESTIONS } from "../constants/questions";
import { Audio } from "expo-av";

// ADS
import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

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
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [canContinue, setCanContinue] = useState(false);

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
    } catch {}
  };

  // ⏱ TIMER
  useEffect(() => {
    if (time === 0) {
      endGame();
      return;
    }

    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  // 💥 LOAD INTERSTITIAL
  useEffect(() => {
    interstitial.load();
    rewarded.load();
  }, []);

  const showInterstitial = () => {
    if (interstitial.loaded) {
      interstitial.show();
    }
  };

  const showRewarded = () => {
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      setCanContinue(true);
      nextQuestion();
    });

    rewarded.load();
    rewarded.show();
  };

  const nextQuestion = () => {
    setIndex(index + 1);
    setSelected(null);
    setTime(15);
    setHiddenOptions([]);
  };

  const endGame = () => {
    showInterstitial(); // 💥 pub ici seulement
    router.push({ pathname: "/results", params: { money } });
  };

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
          nextQuestion();
        } else {
          endGame();
        }
      } else {
        await playSound("wrong");
        setCanContinue(true); // 🎁 possibilité de continuer
      }
    }, 800);
  };

  // 💡 50/50
  const useFiftyFifty = () => {
    const wrongOptions = current.options.filter(
      (opt) => opt !== current.answer
    );
    setHiddenOptions(wrongOptions.slice(0, 2));
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
                (isCorrect ? styles.correct : styles.wrong),
            ]}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {/* 🎁 CONTINUE AVEC PUB */}
      {canContinue && (
        <TouchableOpacity style={styles.rewardBtn} onPress={showRewarded}>
          <Text style={{ color: "white" }}>
            🎁 Continuer (regarder une pub)
          </Text>
        </TouchableOpacity>
      )}

      {/* 💡 JOKER */}
      <TouchableOpacity style={styles.joker} onPress={useFiftyFifty}>
        <Text style={{ color: "white" }}>💡 50/50</Text>
      </TouchableOpacity>

      {/* 📢 BANNER */}
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <BannerAd
          unitId="ca-app-pub-5350081816144613/9386901047"
          size={BannerAdSize.BANNER}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0A0F2C",
  },

  moneyBox: {
    backgroundColor: "#FFD700",
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
  },

  money: {
    fontSize: 22,
    fontWeight: "bold",
  },

  progress: {
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },

  timer: {
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#1E3A8A",
    padding: 25,
    borderRadius: 25,
    marginBottom: 20,
  },

  question: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },

  option: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 25,
    marginVertical: 6,
  },

  optionText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  correct: {
    backgroundColor: "green",
  },

  wrong: {
    backgroundColor: "red",
  },

  joker: {
    marginTop: 15,
    alignSelf: "center",
    backgroundColor: "#9333EA",
    padding: 10,
    borderRadius: 20,
  },

  rewardBtn: {
    marginTop: 15,
    alignSelf: "center",
    backgroundColor: "#F59E0B",
    padding: 12,
    borderRadius: 20,
  },
});