import React, { useState } from "react";
import AppContainer from "./src/providers/AppContainer";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegistrationScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import ParentHome from "./src/screens/ParentHome";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "./src/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

async function handleLogin(email: string, password: string): Promise<{ role: string; userName: string } | null> {
  try {
    console.log("Starting login process...");
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log("User signed in, fetching Firestore data...");

    // Fetch user document from Firestore
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const role = userData.role;
      const userName = userData.name || userCred.user.displayName || userCred.user.email || "User";

      console.log("User role:", role);

      if (role === "admin") {
        console.log("Navigating to Admin Dashboard");
        return { role: "admin", userName };
      } else if (role === "parent") {
        console.log("Navigating to Parent Home");
        return { role: "parent", userName };
      } else {
        alert("Role not found. Please contact admin.");
        return null;
      }
    } else {
      alert("User record not found in database. Please contact admin.");
      return null;
    }
  } catch (err: unknown) {
    console.error("Login error:", err);
    if (err instanceof Error) {
      alert("Login failed: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
    return null;
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
  const [mode, setMode] = useState<"login" | "register" | "admin" | "parent">("login");
  const [userName, setUserName] = useState<string>("");

  const handleLogout = () => {
    console.log("User logged out");
    setMode("login");
    setUserName("");
  };

  return (
    <AppContainer>
      {mode === "login" ? (
        <LoginScreen
          onLogin={async (email, password) => {
            const result = await handleLogin(email, password);
            if (result) {
              setUserName(result.userName);
              setMode(result.role === "admin" ? "admin" : "parent");
            }
          }}
          onGoRegister={() => setMode("register")}
        />
      ) : mode === "register" ? (
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
      ) : mode === "admin" ? (
        <AdminDashboard userName={userName} onLogout={handleLogout} />
      ) : (
        <ParentHome userName={userName} onLogout={handleLogout} />
      )}
    </AppContainer>
  );
}
