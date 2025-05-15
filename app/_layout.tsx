import { Stack } from "expo-router";
import React from "react";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </ChatProvider>
    </ThemeProvider>
  );
}
