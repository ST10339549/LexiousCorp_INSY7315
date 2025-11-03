
import React, { useState, useEffect } from "react";
import { Box, VStack, Text, Button, HStack, Heading, useToast, ScrollView, Spinner, Divider } from "native-base";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendTestNotification } from "../services/notifications";
import { subscribeAnnouncements, Announcement } from "../services/announcements";

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
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

  /**
   * Format timestamp for display
   */
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Unknown date";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  /**
   * Subscribe to announcements updates
   */
  useEffect(() => {
    console.log("[StaffDashboard] Setting up announcements subscription");

    const unsubscribe = subscribeAnnouncements(
      (updatedAnnouncements) => {
        console.log(`[StaffDashboard] Received ${updatedAnnouncements.length} announcements`);
        setAnnouncements(updatedAnnouncements.slice(0, 3));
        setLoadingAnnouncements(false);
      },
      3, // Limit to 3 most recent announcements
      "staff" // Filter for staff-relevant announcements
    );

    return () => {
      console.log("[StaffDashboard] Cleaning up announcements subscription");
      unsubscribe();
    };
  }, []);

  return (
    <Box flex={1} bg="bg.900" safeArea>
      <ScrollView flex={1}>
        <VStack space={6} px={6} py={12}>
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

          {/* Announcements Section */}
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Heading color="white" size="lg">
                📢 Announcements
              </Heading>
              {announcements.length > 0 && onNavigateToAnnouncements && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={onNavigateToAnnouncements}
                  _text={{ color: "brand.500", fontWeight: "600" }}
                >
                  View All
                </Button>
              )}
            </HStack>

            {/* Announcements List */}
            {loadingAnnouncements ? (
              <Box py={6} alignItems="center">
                <Spinner size="sm" color="brand.500" />
              </Box>
            ) : announcements.length === 0 ? (
              <Box
                bg="coolGray.800"
                p={4}
                rounded="xl"
                borderWidth={1}
                borderColor="coolGray.700"
                alignItems="center"
              >
                <Text fontSize="2xl" mb={1}>
                  �
                </Text>
                <Text color="coolGray.500" fontSize="sm" textAlign="center">
                  No announcements at this time
                </Text>
              </Box>
            ) : (
              <VStack space={3}>
                {announcements.map((announcement) => (
                  <Box
                    key={announcement.id}
                    bg="coolGray.800"
                    p={4}
                    rounded="xl"
                    borderWidth={1}
                    borderColor="coolGray.700"
                  >
                    <VStack space={2}>
                      <HStack justifyContent="space-between" alignItems="flex-start">
                        <Text
                          color="white"
                          fontSize="md"
                          fontWeight="bold"
                          flex={1}
                        >
                          {announcement.title}
                        </Text>
                        <Text color="coolGray.500" fontSize="xs" ml={2}>
                          {formatDate(announcement.createdAt)}
                        </Text>
                      </HStack>
                      <Text
                        color="coolGray.300"
                        fontSize="sm"
                        numberOfLines={2}
                      >
                        {announcement.body}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>

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
                <Text fontSize="xl">�</Text>
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
                <Text fontSize="xl">�</Text>
                <Text color="white" fontSize="md" fontWeight="500">
                  My Class/Children
                </Text>
              </HStack>
            </Button>

            {/* Send Test Notification Button */}
            <Button
              variant="outline"
              rounded="xl"
              py={4}
              onPress={handleSendTestNotification}
              isLoading={sendingNotification}
              _loading={{
                bg: "blueGray.700",
                opacity: 0.5,
              }}
              borderColor="blueGray.600"
              _text={{ color: "white" }}
              _pressed={{ bg: "blueGray.700" }}
            >
              <HStack space={3} alignItems="center">
                <Text fontSize="xl">🔔</Text>
                <Text color="coolGray.100" fontSize="md" fontWeight="500">
                  Test Notifications
                </Text>
              </HStack>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
