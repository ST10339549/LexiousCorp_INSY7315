import React, { useState } from "react";
import AppContainer from "./src/providers/AppContainer";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegistrationScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import StaffDashboard from "./src/screens/StaffDashboard";
import ParentHome from "./src/screens/ParentHome";
import AttendanceScreen from "./src/screens/AttendanceScreen";
import AddChildScreen from "./src/screens/AddChildScreen";
import ParentChildren from "./src/screens/ParentChildren";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "./src/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { registerForPushNotifications } from "./src/services/notifications";
import { Role } from "./src/types/user";

async function handleLogin(email: string, password: string): Promise<{ role: string; userName: string; userId: string } | null> {
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
      const role = userData.role as Role;
      const userName = userData.name || userCred.user.displayName || userCred.user.email || "User";

      console.log("User role:", role);

      // Register for push notifications after successful login
      console.log("Registering for push notifications...");
      registerForPushNotifications(uid).then((token) => {
        if (token) {
          console.log("✅ Push notifications registered successfully");
        } else {
          console.log("⚠️ Push notification registration skipped (likely emulator/simulator)");
        }
      }).catch((error) => {
        console.error("❌ Push notification registration error:", error);
        // Don't block login if notification registration fails
      });

      if (role === "admin") {
        console.log("Navigating to Admin Dashboard");
        return { role: "admin", userName, userId: uid };
      } else if (role === "staff") {
        console.log("Navigating to Staff Dashboard");
        return { role: "staff", userName, userId: uid };
      } else if (role === "parent") {
        console.log("Navigating to Parent Home");
        return { role: "parent", userName, userId: uid };
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
      role: "parent", // Default role for self-registration - staff and admin roles must be assigned by an admin in Firebase Console
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
  const [mode, setMode] = useState<"login" | "register" | "admin" | "staff" | "parent" | "attendance" | "addChild" | "parentChildren">("login");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<Role>("parent");
  const [userId, setUserId] = useState<string>("");

  const handleLogout = () => {
    console.log("User logged out");
    setMode("login");
    setUserName("");
    setUserRole("parent");
    setUserId("");
  };

  const handleNavigateToAttendance = () => {
    console.log("Navigating to Attendance Screen");
    setMode("attendance");
  };

  const handleNavigateToAddChild = () => {
    console.log("Navigating to Add Child Screen");
    setMode("addChild");
  };

  const handleNavigateToParentChildren = () => {
    console.log("Navigating to Parent Children Screen");
    setMode("parentChildren");
  };

  const handleBackToAdminDashboard = () => {
    console.log("Navigating back to Admin Dashboard");
    setMode("admin");
  };

  const handleBackToStaffDashboard = () => {
    console.log("Navigating back to Staff Dashboard");
    setMode("staff");
  };

  const handleBackToParentHome = () => {
    console.log("Navigating back to Parent Home");
    setMode("parent");
  };

  return (
    <AppContainer>
      {mode === "login" ? (
        <LoginScreen
          onLogin={async (email, password) => {
            const result = await handleLogin(email, password);
            if (result) {
              setUserName(result.userName);
              setUserRole(result.role as Role);
              setUserId(result.userId);
              if (result.role === "admin") {
                setMode("admin");
              } else if (result.role === "staff") {
                setMode("staff");
              } else {
                setMode("parent");
              }
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
        <AdminDashboard 
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
          onNavigateToAttendance={handleNavigateToAttendance}
          onNavigateToAddChild={handleNavigateToAddChild}
        />
      ) : mode === "staff" ? (
        <StaffDashboard
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
          onNavigateToAttendance={handleNavigateToAttendance}
        />
      ) : mode === "attendance" ? (
        <AttendanceScreen onBack={() => {
          if (userRole === "admin") {
            handleBackToAdminDashboard();
          } else if (userRole === "staff") {
            handleBackToStaffDashboard();
          } else {
            handleBackToParentHome();
          }
        }} />
      ) : mode === "addChild" ? (
        <AddChildScreen 
          userRole={userRole}
          userId={userId}
          onBack={() => {
            if (userRole === "admin") {
              handleBackToAdminDashboard();
            } else if (userRole === "staff") {
              handleBackToStaffDashboard();
            } else {
              handleBackToParentHome();
            }
          }}
          onSuccess={() => {
            if (userRole === "admin") {
              handleBackToAdminDashboard();
            } else if (userRole === "staff") {
              handleBackToStaffDashboard();
            } else {
              handleBackToParentHome();
            }
          }}
        />
      ) : mode === "parentChildren" ? (
        <ParentChildren
          parentId={userId}
          parentName={userName}
          onAddChild={handleNavigateToAddChild}
          onBack={handleBackToParentHome}
        />
      ) : (
        <ParentHome 
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
          onNavigateToAddChild={handleNavigateToAddChild}
          onNavigateToMyChildren={handleNavigateToParentChildren}
        />
      )}
    </AppContainer>
  );
}
