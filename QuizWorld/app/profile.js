import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
  Alert,
} from "react-native";

// 🔒 SAFE LINK
const openLink = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erreur", "Impossible d’ouvrir ce lien");
    }
  } catch {
    Alert.alert("Erreur", "Une erreur est survenue");
  }
};

export default function Profile() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>Sidy Mohamed Diallo</Text>
        <Text style={styles.subtitle}>Créateur de QuizWorld</Text>
      </View>

      {/* SECTION RÉSEAUX */}
      <Text style={styles.section}>🌐 Réseaux</Text>

      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          openLink("https://www.facebook.com/sidymohamed.diallo.503")
        }
      >
        <Text style={styles.itemTitle}>Facebook</Text>
        <Text style={styles.itemSub}>Voir mon profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          openLink("https://wa.me/224626547176")
        }
      >
        <Text style={styles.itemTitle}>WhatsApp</Text>
        <Text style={styles.itemSub}>Me contacter</Text>
      </TouchableOpacity>

      {/* SECTION APP */}
      <Text style={styles.section}>ℹ️ Application</Text>

      <View style={styles.itemStatic}>
        <Text style={styles.itemTitle}>QuizWorld</Text>
        <Text style={styles.itemSub}>Version 1.0</Text>
      </View>

      <View style={styles.itemStatic}>
        <Text style={styles.itemTitle}>💡 Objectif</Text>
        <Text style={styles.itemSub}>
          Devenir le meilleur joueur mondial
        </Text>
      </View>

    </ScrollView>
  );
}

// 🎨 DESIGN STYLE NETFLIX
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#0A0F2C",
    flexGrow: 1,
  },

  header: {
    backgroundColor: "#111827",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  avatar: {
    fontSize: 60,
    marginBottom: 10,
  },

  name: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#9CA3AF",
    marginTop: 5,
  },

  section: {
    color: "#9CA3AF",
    marginBottom: 10,
    marginTop: 10,
    fontSize: 14,
    letterSpacing: 1,
  },

  item: {
    backgroundColor: "#1E3A8A",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
  },

  itemStatic: {
    backgroundColor: "#111827",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
  },

  itemTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  itemSub: {
    color: "#D1D5DB",
    marginTop: 4,
  },
});