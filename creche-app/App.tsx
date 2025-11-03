import React, { useState } from "react";
import AppContainer from "./src/providers/AppContainer";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegistrationScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import StaffDashboard from "./src/screens/StaffDashboard";
import StaffMyClassScreen from "./src/screens/StaffMyClassScreen";
import ParentHome from "./src/screens/ParentHome";
import AttendanceScreen from "./src/screens/AttendanceScreen";
import AddChildScreen from "./src/screens/AddChildScreen";
import ParentChildren from "./src/screens/ParentChildren";
import ManageUsersScreen from "./src/screens/ManageUsersScreen";
import AssignChildrenScreen from "./src/screens/AssignChildrenScreen";
import CreateAnnouncementScreen from "./src/screens/CreateAnnouncementScreen";
import AnnouncementsScreen from "./src/screens/AnnouncementsScreen";
import StaffAnnouncementsScreen from "./src/screens/StaffAnnouncementsScreen";
import ManageEventsScreen from "./src/screens/ManageEventsScreen";
import ParentEventsCalendar from "./src/screens/ParentEventsCalendar";
import ManageMenuScreen from "./src/screens/ManageMenuScreen";
import LunchOrderScreen from "./src/screens/LunchOrderScreen";
import OrdersAdminScreen from "./src/screens/OrdersAdminScreen";
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
  const [mode, setMode] = useState<"login" | "register" | "admin" | "staff" | "parent" | "attendance" | "addChild" | "parentChildren" | "manageUsers" | "assignChildren" | "staffMyClass" | "createAnnouncement" | "announcements" | "staffAnnouncements" | "manageEvents" | "parentEvents" | "manageMenu" | "lunchOrders" | "viewOrders">("login");
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

  const handleNavigateToManageUsers = () => {
    console.log("Navigating to Manage Users Screen");
    setMode("manageUsers");
  };

  const handleNavigateToAssignChildren = () => {
    console.log("Navigating to Assign Children Screen");
    setMode("assignChildren");
  };

  const handleNavigateToStaffMyClass = () => {
    console.log("Navigating to Staff My Class Screen");
    setMode("staffMyClass");
  };

  const handleNavigateToCreateAnnouncement = () => {
    console.log("Navigating to Create Announcement Screen");
    setMode("createAnnouncement");
  };

  const handleNavigateToAnnouncements = () => {
    console.log("Navigating to Announcements Screen");
    setMode("announcements");
  };

  const handleNavigateToStaffAnnouncements = () => {
    console.log("Navigating to Staff Announcements Screen");
    setMode("staffAnnouncements");
  };

  const handleNavigateToManageEvents = () => {
    console.log("Navigating to Manage Events Screen");
    setMode("manageEvents");
  };

  const handleNavigateToParentEvents = () => {
    console.log("Navigating to Parent Events Calendar");
    setMode("parentEvents");
  };

  const handleNavigateToManageMenu = () => {
    console.log("Navigating to Manage Menu Screen");
    setMode("manageMenu");
  };

  const handleNavigateToLunchOrders = () => {
    console.log("Navigating to Lunch Orders Screen");
    setMode("lunchOrders");
  };

  const handleNavigateToViewOrders = () => {
    console.log("Navigating to View Orders Screen");
    setMode("viewOrders");
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
          onNavigateToManageUsers={handleNavigateToManageUsers}
          onNavigateToAssignChildren={handleNavigateToAssignChildren}
          onNavigateToCreateAnnouncement={handleNavigateToCreateAnnouncement}
          onNavigateToManageEvents={handleNavigateToManageEvents}
          onNavigateToManageMenu={handleNavigateToManageMenu}
          onNavigateToViewOrders={handleNavigateToViewOrders}
        />
      ) : mode === "staff" ? (
        <StaffDashboard
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
          onNavigateToAttendance={handleNavigateToAttendance}
          onNavigateToMyClass={handleNavigateToStaffMyClass}
          onNavigateToAnnouncements={handleNavigateToStaffAnnouncements}
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
      ) : mode === "manageUsers" ? (
        <ManageUsersScreen
          currentUserId={userId}
          onBack={handleBackToAdminDashboard}
        />
      ) : mode === "assignChildren" ? (
        <AssignChildrenScreen
          currentAdminId={userId}
          onBack={handleBackToAdminDashboard}
        />
      ) : mode === "staffMyClass" ? (
        <StaffMyClassScreen
          staffId={userId}
          staffName={userName}
          onBack={handleBackToStaffDashboard}
        />
      ) : mode === "createAnnouncement" ? (
        <CreateAnnouncementScreen
          onBack={handleBackToAdminDashboard}
          onAnnouncementCreated={handleBackToAdminDashboard}
        />
      ) : mode === "announcements" ? (
        <AnnouncementsScreen
          onBack={handleBackToParentHome}
        />
      ) : mode === "staffAnnouncements" ? (
        <StaffAnnouncementsScreen
          onBack={handleBackToStaffDashboard}
        />
      ) : mode === "manageEvents" ? (
        <ManageEventsScreen
          userId={userId}
          onBack={handleBackToAdminDashboard}
        />
      ) : mode === "parentEvents" ? (
        <ParentEventsCalendar
          onBack={handleBackToParentHome}
        />
      ) : mode === "manageMenu" ? (
        <ManageMenuScreen
          navigation={{ goBack: handleBackToAdminDashboard }}
        />
      ) : mode === "lunchOrders" ? (
        <LunchOrderScreen
          userId={userId}
          onNavigateBack={handleBackToParentHome}
        />
      ) : mode === "viewOrders" ? (
        <OrdersAdminScreen
          onNavigateBack={handleBackToAdminDashboard}
        />
      ) : (
        <ParentHome 
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
          onNavigateToAddChild={handleNavigateToAddChild}
          onNavigateToMyChildren={handleNavigateToParentChildren}
          onNavigateToAnnouncements={handleNavigateToAnnouncements}
          onNavigateToEvents={handleNavigateToParentEvents}
          onNavigateToLunchOrders={handleNavigateToLunchOrders}
        />
      )}
    </AppContainer>
  );
}
