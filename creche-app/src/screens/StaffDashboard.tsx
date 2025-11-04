import React, { useState, useEffect } from "react";
import { Box, VStack, Text, HStack, Heading, ScrollView, Spinner, Icon, Pressable } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { subscribeAnnouncements, Announcement } from "../services/announcements";
import { AppCard } from "../components/shared";

type StaffDashboardProps = {
    userName?: string;
    userId?: string;
    onLogout?: () => void;
    onNavigateToAttendance?: () => void;
    onNavigateToAddChild?: () => void;
    onNavigateToMyClass?: () => void;
    onNavigateToAnnouncements?: () => void;
};

export default function StaffDashboard({
    userName,
    userId,
    onLogout,
    onNavigateToAttendance,
    onNavigateToAddChild,
    onNavigateToMyClass,
    onNavigateToAnnouncements,
}: StaffDashboardProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            if (onLogout) onLogout();
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout");
        }
    };

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

    useEffect(() => {
        console.log("[StaffDashboard] Setting up announcements subscription");

        const unsubscribe = subscribeAnnouncements(
            (updatedAnnouncements) => {
                console.log(`[StaffDashboard] Received ${updatedAnnouncements.length} announcements`);
                setAnnouncements(updatedAnnouncements.slice(0, 3));
                setLoadingAnnouncements(false);
            },
            3,
            "staff"
        );

        return () => {
            console.log("[StaffDashboard] Cleaning up announcements subscription");
            unsubscribe();
        };
    }, []);

    return (
        <Box flex={1} bg="#F7F9FC" safeArea>
            <ScrollView flex={1}>
                <VStack space={6} px={4} py={6}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Heading color="gray.800" size="xl" fontWeight="700">
                                Staff Dashboard
                            </Heading>
                            <Text color="gray.600" fontSize="md">
                                Welcome, {userName || "Staff"}
                            </Text>
                        </VStack>
                        <Pressable
                            onPress={handleLogout}
                            p={2}
                            borderRadius="full"
                            bg="error.50"
                            _pressed={{ bg: "error.100" }}
                        >
                            <Icon as={Ionicons} name="log-out-outline" size={6} color="error.500" />
                        </Pressable>
                    </HStack>

                    <VStack space={4}>
                        <Heading color="gray.800" size="md" fontWeight="600">
                            Quick Actions
                        </Heading>
                        
                        <HStack space={3}>
                            <Pressable
                                flex={1}
                                onPress={() => onNavigateToAttendance && onNavigateToAttendance()}
                                _pressed={{ opacity: 0.7 }}
                            >
                                <AppCard bg="primary.400" h="110px">
                                    <VStack space={2} alignItems="center" justifyContent="center" flex={1}>
                                        <Icon as={Ionicons} name="checkmark-circle" size={8} color="white" />
                                        <Text color="white" fontSize="sm" fontWeight="600" textAlign="center">
                                            Take Attendance
                                        </Text>
                                    </VStack>
                                </AppCard>
                            </Pressable>

                            <Pressable
                                flex={1}
                                onPress={() => onNavigateToMyClass && onNavigateToMyClass()}
                                _pressed={{ opacity: 0.7 }}
                            >
                                <AppCard bg="success.500" h="110px">
                                    <VStack space={2} alignItems="center" justifyContent="center" flex={1}>
                                        <Icon as={Ionicons} name="people" size={8} color="white" />
                                        <Text color="white" fontSize="sm" fontWeight="600" textAlign="center">
                                            My Class
                                        </Text>
                                    </VStack>
                                </AppCard>
                            </Pressable>
                        </HStack>

                        <HStack space={3}>
                            <Pressable
                                flex={1}
                                onPress={() => onNavigateToAnnouncements && onNavigateToAnnouncements()}
                                _pressed={{ opacity: 0.7 }}
                            >
                                <AppCard bg="accent.400" h="110px">
                                    <VStack space={2} alignItems="center" justifyContent="center" flex={1}>
                                        <Icon as={Ionicons} name="megaphone" size={8} color="white" />
                                        <Text color="white" fontSize="sm" fontWeight="600" textAlign="center">
                                            Announcements
                                        </Text>
                                    </VStack>
                                </AppCard>
                            </Pressable>
                            
                            <Pressable
                                flex={1}
                                onPress={() => onNavigateToAddChild && onNavigateToAddChild()}
                                _pressed={{ opacity: 0.7 }}
                            >
                                <AppCard bg="info.500" h="110px">
                                    <VStack space={2} alignItems="center" justifyContent="center" flex={1}>
                                        <Icon as={Ionicons} name="person-add" size={8} color="white" />
                                        <Text color="white" fontSize="sm" fontWeight="600" textAlign="center">
                                            Add Child
                                        </Text>
                                    </VStack>
                                </AppCard>
                            </Pressable>
                        </HStack>
                    </VStack>

                    <VStack space={4} mt={2}>
                        <HStack justifyContent="space-between" alignItems="center">
                            <Heading color="gray.800" size="md" fontWeight="600">
                                Recent Announcements
                            </Heading>
                        </HStack>

                        {loadingAnnouncements ? (
                            <AppCard>
                                <Box py={4} alignItems="center">
                                    <Spinner size="sm" color="primary.400" />
                                </Box>
                            </AppCard>
                        ) : announcements.length === 0 ? (
                            <AppCard>
                                <VStack space={2} alignItems="center" py={4}>
                                    <Icon as={Ionicons} name="notifications-off-outline" size={12} color="gray.300" />
                                    <Text color="gray.500" fontSize="sm" textAlign="center">
                                        No announcements at this time
                                    </Text>
                                </VStack>
                            </AppCard>
                        ) : (
                            <VStack space={3}>
                                {announcements.map((announcement) => (
                                    <AppCard key={announcement.id}>
                                        <VStack space={2}>
                                            <HStack justifyContent="space-between" alignItems="flex-start">
                                                <HStack space={2} alignItems="center" flex={1}>
                                                    <Icon as={Ionicons} name="megaphone" size={5} color="primary.400" />
                                                    <Text
                                                        color="gray.800"
                                                        fontSize="md"
                                                        fontWeight="600"
                                                        flex={1}
                                                    >
                                                        {announcement.title}
                                                    </Text>
                                                </HStack>
                                                <Text color="gray.500" fontSize="xs" ml={2}>
                                                    {formatDate(announcement.createdAt)}
                                                </Text>
                                            </HStack>
                                            <Text
                                                color="gray.600"
                                                fontSize="sm"
                                                numberOfLines={2}
                                                ml={7}
                                            >
                                                {announcement.body}
                                            </Text>
                                        </VStack>
                                    </AppCard>
                                ))}
                            </VStack>
                        )}
                    </VStack>
                </VStack>
            </ScrollView>
        </Box>
    );
}
