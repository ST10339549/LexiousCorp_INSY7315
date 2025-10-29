import React, { useState } from "react";
import AppContainer from "./src/providers/AppContainer";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegistrationScreen";

export default function App() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <AppContainer>
      {mode === "login" ? (
        <LoginScreen
          onLogin={async (email, password) => {
            console.log("TODO: Firebase signInWithEmailAndPassword", email);
          }}
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
