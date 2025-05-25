import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Splashscreen.png")}
        style={styles.background}
        resizeMode="cover"
        blurRadius={1}
      />
      <View style={styles.overlay}>
        <Image source={require("../assets/images/logo.png")} style={styles.logo} />
        <Text style={styles.appName}>AquaChat</Text>
      </View>
      <Text style={styles.poweredBy}>
        Powered by <Text style={styles.kurmaBold}>KurmaAI</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 1,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 26,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 1,
    fontFamily: "BricolageGrotesque-Regular", // Use Bricolage Grotesque for AquaChat
  },
  poweredBy: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    letterSpacing: 1,
    opacity: 0.8,
    fontFamily: "BricolageGrotesque-Regular", // Use Bricolage Grotesque for powered by text
    fontStyle: "italic",
  },
  kurmaBold: {
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "BricolageGrotesque-Bold", // Use Bricolage Grotesque Bold for KurmaAI
  },
});
