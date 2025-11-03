import React, { useState, useEffect } from "react";
import { Box, VStack, Text, Button, HStack, Heading, useToast, ScrollView, Spinner, Divider } from "native-base";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendTestNotification } from "../services/notifications";
import { subscribeAnnouncements, Announcement } from "../services/announcements";

type AdminDashboardProps = {
    userName?: string;
    userId?: string;
    onLogout?: () => void;
    onNavigateToAttendance?: () => void;
    onNavigateToAddChild?: () => void;
    onNavigateToManageUsers?: () => void;
    onNavigateToAssignChildren?: () => void;
    onNavigateToCreateAnnouncement?: () => void;
};

export default function AdminDashboard({ userName, userId, onLogout, onNavigateToAttendance, onNavigateToAddChild, onNavigateToManageUsers, onNavigateToAssignChildren, onNavigateToCreateAnnouncement }: AdminDashboardProps) {
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
     * Send a test notification to the current admin user
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
        console.log("[AdminDashboard] Setting up announcements subscription");

        const unsubscribe = subscribeAnnouncements(
            (updatedAnnouncements) => {
                console.log(`[AdminDashboard] Received ${updatedAnnouncements.length} announcements`);
                // Only show latest 3 announcements on home screen
                setAnnouncements(updatedAnnouncements.slice(0, 3));
                setLoadingAnnouncements(false);
            },
            3, // Limit to 3 most recent announcements
            "all" // Show all announcements for admin
        );

        // Cleanup subscription on unmount
        return () => {
            console.log("[AdminDashboard] Cleaning up announcements subscription");
            unsubscribe();
        };
    }, []);

    return (
        <Box flex={1} bg="bg.900" px={6} py={12}>
            <VStack space={6}>
                {/* Header */}
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack>
                        <Heading color="white" size="xl">
                            Admin Dashboard
                        </Heading>
                        <Text color="coolGray.400" fontSize="md">
                            Welcome back, {userName || "Admin"}
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
                    {/* Manage Users Button */}
                    <Button
                        bg="purple.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToManageUsers && onNavigateToManageUsers()}
                        _pressed={{ bg: "purple.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">👥</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Manage Users & Roles
                            </Text>
                        </HStack>
                    </Button>

                    {/* Daily Attendance Button */}
                    <Button
                        bg="brand.500"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToAttendance && onNavigateToAttendance()}
                        _pressed={{ bg: "brand.600" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">📋</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Daily Attendance
                            </Text>
                        </HStack>
                    </Button>

                    {/* Assign Children to Teachers Button */}
                    <Button
                        bg="teal.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToAssignChildren && onNavigateToAssignChildren()}
                        _pressed={{ bg: "teal.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">🎓</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Assign Children to Teachers
                            </Text>
                        </HStack>
                    </Button>

                    {/* Add Child Button */}
                    <Button
                        bg="green.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToAddChild && onNavigateToAddChild()}
                        _pressed={{ bg: "green.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">👶</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Add Child
                            </Text>
                        </HStack>
                    </Button>

                    {/* Create Announcement Button */}
                    <Button
                        bg="indigo.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToCreateAnnouncement && onNavigateToCreateAnnouncement()}
                        _pressed={{ bg: "indigo.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">📢</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Create Announcement
                            </Text>
                        </HStack>
                    </Button>

                    {/* Send Test Notification Button */}
                    <Button
                        bg="orange.600"
                        rounded="xl"
                        py={4}
                        onPress={handleSendTestNotification}
                        isLoading={sendingNotification}
                        isLoadingText="Sending..."
                        _pressed={{ bg: "orange.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">🔔</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Send Test Notification
                            </Text>
                        </HStack>
                    </Button>

                    {/* Placeholder for future features */}
                    <Box bg="coolGray.800" p={4} rounded="xl" borderWidth={1} borderColor="coolGray.700">
                        <Text color="coolGray.400" textAlign="center" fontWeight="500">
                            More admin features coming soon!
                        </Text>
                    </Box>
                </VStack>
            </VStack>
        </Box>
    );
}
