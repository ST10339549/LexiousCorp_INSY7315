import React, { useState } from "react";
import AppContainer from "./src/providers/AppContainer";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegistrationScreen";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "./src/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

async function handleLogin(email: string, password: string) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    alert("Welcome back, " + (userCred.user.displayName || userCred.user.email));
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert("Login failed: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
  }
}

async function handleRegister(fullName: string, email: string, password: string) {
  console.log("handleRegister called with:", { fullName, email });
  try {
    console.log("Creating user with email and password...");
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created successfully:", userCred.user.uid);
    
    // Update the user's display name
    console.log("Updating profile with display name...");
    await updateProfile(userCred.user, {
      displayName: fullName,
    });
    console.log("Profile updated successfully");
    
    // Create user document in Firestore
    console.log("Creating user document in Firestore...");
    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      name: fullName,
      email: email.toLowerCase(),
      role: "parent", // Default role - can be changed to "admin" manually in Firebase Console
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("User document created in Firestore");
    
    alert("Account created successfully! Welcome " + fullName);
    return true;
  } catch (err: unknown) {
    console.error("Registration error:", err);
    if (err instanceof Error) {
      alert("Registration failed: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
    return false;
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
            console.log("RegisterScreen onRegister called");
            const success = await handleRegister(fullName, email, password);
            // Switch to login screen after successful registration
            if (success) {
              console.log("Registration successful, switching to login");
              setMode("login");
            }
          }}
          onGoLogin={() => setMode("login")}
        />
      )}
    </AppContainer>
  );
}
