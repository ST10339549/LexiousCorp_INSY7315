
import React, { useState } from "react";
import { Box, VStack, Text, Button, HStack, Heading, useToast } from "native-base";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendTestNotification } from "../services/notifications";

type StaffDashboardProps = {
  userName?: string;
  userId?: string;
  onLogout?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToMyClass?: () => void;
  onNavigateToAnnouncements?: () => void;
};

export default function StaffDashboard({
  userName,
  userId,
  onLogout,
  onNavigateToAttendance,
  onNavigateToMyClass,
  onNavigateToAnnouncements,
}: StaffDashboardProps) {
  const [sendingNotification, setSendingNotification] = useState(false);
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout");
    }
  };

  /**
   * Send a test notification to the current staff user
   */
  const handleSendTestNotification = async () => {
    if (!userId) {
      toast.show({
        title: "Error: User ID not found",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    setSendingNotification(true);

    try {
      // Fetch user's push token from Firestore
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        toast.show({
          title: "Error: User not found",
          placement: "top",
          bg: "red.500",
        });
        setSendingNotification(false);
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData.pushToken;

      if (!pushToken) {
        toast.show({
          title: "No Push Token",
          description: "Please restart the app to register for notifications",
          placement: "top",
          duration: 4000,
          bg: "orange.500",
        });
        setSendingNotification(false);
        return;
      }

      console.log("Sending test notification to:", pushToken);

      // Send test notification
      const success = await sendTestNotification(pushToken);

      if (success) {
        toast.show({
          title: "✅ Notification Sent!",
          description: "Check your notification tray",
          placement: "top",
          duration: 3000,
          bg: "green.500",
        });
      } else {
        toast.show({
          title: "Failed to Send",
          description: "Could not send notification. Check console.",
          placement: "top",
          bg: "red.500",
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.show({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  /**
   * Handle placeholder navigation actions
   */
  const handleTakeAttendance = () => {
    if (onNavigateToAttendance) {
      onNavigateToAttendance();
    } else {
      toast.show({
        title: "Take Attendance",
        description: "This feature will allow staff to mark daily attendance",
        placement: "top",
        duration: 3000,
        bg: "blue.500",
      });
    }
  };

  const handleMyClass = () => {
    if (onNavigateToMyClass) {
      onNavigateToMyClass();
    } else {
      toast.show({
        title: "My Class/Children",
        description: "This feature will show assigned children and class information",
        placement: "top",
        duration: 3000,
        bg: "blue.500",
      });
    }
  };

  const handleAnnouncements = () => {
    if (onNavigateToAnnouncements) {
      onNavigateToAnnouncements();
    } else {
      toast.show({
        title: "Announcements",
        description: "This feature will display and manage announcements",
        placement: "top",
        duration: 3000,
        bg: "blue.500",
      });
    }
  };

  return (
    <Box flex={1} bg="bg.900" px={6} py={12} safeArea>
      <VStack space={6}>
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading color="white" size="xl">
              Staff Dashboard
            </Heading>
            <Text color="coolGray.400" fontSize="md">
              Welcome, {userName || "Staff"}
            </Text>
          </VStack>
          <Button
            onPress={handleLogout}
            variant="outline"
            borderColor="red.500"
            _text={{ color: "red.500" }}
          >
            Logout
          </Button>
        </HStack>

        {/* Dashboard Actions */}
        <VStack space={4}>
          {/* Take Attendance Button */}
          <Button
            bg="brand.500"
            rounded="xl"
            py={4}
            onPress={handleTakeAttendance}
            _pressed={{ bg: "brand.600" }}
          >
            <HStack space={3} alignItems="center">
              <Text fontSize="xl">📋</Text>
              <Text color="white" fontSize="md" fontWeight="500">
                Take Attendance
              </Text>
            </HStack>
          </Button>

          {/* My Class/Children Button */}
          <Button
            bg="green.600"
            rounded="xl"
            py={4}
            onPress={handleMyClass}
            _pressed={{ bg: "green.700" }}
          >
            <HStack space={3} alignItems="center">
              <Text fontSize="xl">👶</Text>
              <Text color="white" fontSize="md" fontWeight="500">
                My Class/Children
              </Text>
            </HStack>
          </Button>

          {/* Announcements Button */}
          <Button
            bg="orange.600"
            rounded="xl"
            py={4}
            onPress={handleAnnouncements}
            _pressed={{ bg: "orange.700" }}
          >
            <HStack space={3} alignItems="center">
              <Text fontSize="xl">📢</Text>
              <Text color="white" fontSize="md" fontWeight="500">
                Announcements
              </Text>
            </HStack>
          </Button>

          {/* Send Test Notification Button */}
          <Button
            bg="purple.600"
            rounded="xl"
            py={4}
            onPress={handleSendTestNotification}
            isLoading={sendingNotification}
            isLoadingText="Sending..."
            _pressed={{ bg: "purple.700" }}
          >
            <HStack space={3} alignItems="center">
              <Text fontSize="xl">🔔</Text>
              <Text color="white" fontSize="md" fontWeight="500">
                Send Test Notification
              </Text>
            </HStack>
          </Button>

          {/* Placeholder for future features */}
          <Box
            bg="coolGray.800"
            p={4}
            rounded="xl"
            borderWidth={1}
            borderColor="coolGray.700"
          >
            <Text color="coolGray.400" textAlign="center" fontWeight="500">
              More staff features coming soon!
            </Text>
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}
