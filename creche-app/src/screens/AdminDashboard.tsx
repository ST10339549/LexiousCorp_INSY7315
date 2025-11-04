import React, { useState, useEffect } from "react";
import { Box, VStack, Text, Button, HStack, Heading, useToast, ScrollView, Spinner, Divider } from "native-base";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
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
    onNavigateToManageEvents?: () => void;
    onNavigateToManageMenu?: () => void;
    onNavigateToViewOrders?: () => void;
    onNavigateToManageFees?: () => void;
};

export default function AdminDashboard({ userName, userId, onLogout, onNavigateToAttendance, onNavigateToAddChild, onNavigateToManageUsers, onNavigateToAssignChildren, onNavigateToCreateAnnouncement, onNavigateToManageEvents, onNavigateToManageMenu, onNavigateToViewOrders, onNavigateToManageFees }: AdminDashboardProps) {
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
        <Box flex={1} bg="bg.900" safeArea>
            <ScrollView flex={1}>
                <VStack space={6} px={6} py={12}>
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

                    {/* Announcements Section */}
                    <VStack space={4}>
                        <HStack justifyContent="space-between" alignItems="center">
                            <Heading color="white" size="lg">
                                📢 Announcements
                            </Heading>
                            <Button
                                variant="ghost"
                                size="sm"
                                onPress={() => onNavigateToCreateAnnouncement && onNavigateToCreateAnnouncement()}
                                _text={{ color: "brand.500", fontWeight: "600" }}
                            >
                                Create New
                            </Button>
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
                                    📭
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

                    {/* Manage Events Button */}
                    <Button
                        bg="orange.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToManageEvents && onNavigateToManageEvents()}
                        _pressed={{ bg: "orange.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">📅</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Manage Events
                            </Text>
                        </HStack>
                    </Button>

                    {/* Manage Menu Button */}
                    <Button
                        bg="yellow.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToManageMenu && onNavigateToManageMenu()}
                        _pressed={{ bg: "yellow.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">🍽️</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Manage Lunch Menu
                            </Text>
                        </HStack>
                    </Button>

                    {/* View Orders Button */}
                    <Button
                        bg="pink.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToViewOrders && onNavigateToViewOrders()}
                        _pressed={{ bg: "pink.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">�</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                View Lunch Orders
                            </Text>
                        </HStack>
                    </Button>

                    {/* Manage Fees Button */}
                    <Button
                        bg="purple.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToManageFees && onNavigateToManageFees()}
                        _pressed={{ bg: "purple.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">💰</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Manage Fees
                            </Text>
                        </HStack>
                    </Button>

                    {/* Placeholder for future features */}
                </VStack>
                </VStack>
            </ScrollView>
        </Box>
    );
}
