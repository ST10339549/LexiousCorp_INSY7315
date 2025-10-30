import React, { useState } from "react";
import AppContainer from "./src/providers/AppContainer";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegistrationScreen";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./src/firebase";

async function handleLogin(email: string, password: string) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    alert("Welcome back, " + userCred.user.displayName);
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert("Login failed: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
  }
}

export default function App() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <AppContainer>
      {mode === "login" ? (
        <LoginScreen
          onLogin={handleLogin}
          onGoRegister={() => setMode("register")}
        />
      ) : (
        <RegisterScreen
          onRegister={async ({ fullName, email, password }) => {
            console.log("TODO: Firebase createUserWithEmailAndPassword", {
              fullName,
              email,
            });
          }}
          onGoLogin={() => setMode("login")}
        />
      )}
    </AppContainer>
  );
}
