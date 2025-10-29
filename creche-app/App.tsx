import React, { useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import app, { db } from "./src/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function App() {
  const [fireInitOk, setFireInitOk] = useState<boolean>(!!app);
  const [firestoreOk, setFirestoreOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastValue, setLastValue] = useState<string>("(none)");

  // This will run when you tap "Get Started"
  async function handlePress() {
    try {
      setLoading(true);

      // 1. write a test doc to Firestore
      const testRef = doc(db, "healthcheck", "hello");
      await setDoc(testRef, { ping: "ok", ts: Date.now() });

      // 2. read it back
      const snap = await getDoc(testRef);
      if (snap.exists()) {
        setFirestoreOk(true);
        const data = snap.data();
        setLastValue(JSON.stringify(data));
      } else {
        setFirestoreOk(false);
      }
    } catch (err) {
      console.error("Firestore test failed:", err);
      setFirestoreOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Little Lemon Creche App</Text>
        <Text style={styles.subtitle}>Welcome!</Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Firebase wired:</Text>
          <Text style={styles.statusValue}>
            {fireInitOk ? "app ✅" : "app ❌"} /{" "}
            {firestoreOk === null
              ? "firestore ?"
              : firestoreOk
                ? "firestore ✅"
                : "firestore ❌"}
          </Text>
        </View>

        <Text style={styles.smallText}>Last read value: {lastValue}</Text>

        <TouchableOpacity style={styles.button} onPress={handlePress} disabled={loading}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tap the button.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#1f1f1f",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
  },
  statusBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: "#aaa",
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  smallText: {
    fontSize: 12,
    color: "#888",
  },
  button: {
    backgroundColor: "#3a67ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666",
  },
});
