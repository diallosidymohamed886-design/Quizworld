import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from "react-native";

export default function Profile() {

  const openFacebook = () => {
    Linking.openURL("https://www.facebook.com/sidymohamed.diallo.503");
  };

  const openWhatsApp = () => {
    Linking.openURL("https://wa.me/224626547176");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* HEADER */}
      <Text style={styles.title}>👤 Profil</Text>

      {/* CARD PROFIL */}
      <View style={styles.card}>
        <Text style={styles.name}>Sidy Mohamed Diallo</Text>
        <Text style={styles.subtitle}>Créateur de QuizWorld</Text>
      </View>

      {/* LIENS */}
      <Text style={styles.section}>🌐 Réseaux</Text>

      <TouchableOpacity style={styles.item} onPress={openFacebook}>
        <Text style={styles.itemTitle}>Facebook</Text>
        <Text style={styles.itemSub}>Voir mon profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={openWhatsApp}>
        <Text style={styles.itemTitle}>WhatsApp</Text>
        <Text style={styles.itemSub}>Me contacter</Text>
      </TouchableOpacity>

      {/* INFOS APP */}
      <Text style={styles.section}>ℹ️ Application</Text>

      <View style={styles.itemStatic}>
        <Text style={styles.itemTitle}>QuizWorld</Text>
        <Text style={styles.itemSub}>Version 1.0</Text>
      </View>

      <View style={styles.itemStatic}>
        <Text style={styles.itemTitle}>💡 Objectif</Text>
        <Text style={styles.itemSub}>
          Devenir le meilleur joueur
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#0A0F2C",
    flexGrow: 1,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#1E3A8A",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
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
  },

  item: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 15,
    marginBottom: 10,
  },

  itemStatic: {
    backgroundColor: "#111827",
    padding: 18,
    borderRadius: 15,
    marginBottom: 10,
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