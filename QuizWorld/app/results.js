import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function Results() {
  const { money } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 30 }}>💰 {money}</Text>

      <TouchableOpacity onPress={() => router.push("/")}>
        <Text>Rejouer</Text>
      </TouchableOpacity>
    </View>
  );
}