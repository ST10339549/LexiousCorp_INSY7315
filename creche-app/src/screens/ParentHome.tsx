import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  ScrollView,
  Spinner,
  Badge,
  Icon,
  Divider,
  useToast,
} from "native-base";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { listenChildrenByParent, Child } from "../services/children";
import { subscribeAnnouncements, Announcement } from "../services/announcements";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";


type ParentHomeProps = {
  userName?: string;
  userId?: string;
  onLogout?: () => void;
  onNavigateToAddChild?: () => void;
  onNavigateToMyChildren?: () => void;
  onNavigateToAnnouncements?: () => void;
};

export default function ParentHome({
  userName,
  userId,
  onLogout,
  onNavigateToAddChild,
  onNavigateToAnnouncements,
}: ParentHomeProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

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
   * Subscribe to real-time updates for children
   */
  useEffect(() => {
    if (!userId) {
      setLoadingChildren(false);
      return;
    }

    console.log(`[ParentHome] Setting up listener for parentId: ${userId}`);
    setLoadingChildren(true);

    const unsubscribe = listenChildrenByParent(userId, (updatedChildren) => {
      console.log(
        `[ParentHome] Received ${updatedChildren.length} children:`,
        updatedChildren.map((c) => c.name)
      );
      setChildren(updatedChildren);
      setLoadingChildren(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log(`[ParentHome] Cleaning up listener for parentId: ${userId}`);
      unsubscribe();
    };
  }, [userId]);

  /**
   * Subscribe to announcements updates
   */
  useEffect(() => {
    console.log("[ParentHome] Setting up announcements subscription");

    const unsubscribe = subscribeAnnouncements(
      (updatedAnnouncements) => {
        console.log(`[ParentHome] Received ${updatedAnnouncements.length} announcements`);
        // Only show latest 3 announcements on home screen
        setAnnouncements(updatedAnnouncements.slice(0, 3));
        setLoadingAnnouncements(false);
      },
      3, // Limit to 3 most recent announcements
      "parents" // Filter for parent-relevant announcements
    );

    // Cleanup subscription on unmount
    return () => {
      console.log("[ParentHome] Cleaning up announcements subscription");
      unsubscribe();
    };
  }, []);

  /**
   * Calculate child's age from date of birth
   */
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
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
   * Render individual child card
   */
  const renderChildCard = (child: Child) => {
    const age = calculateAge(child.dateOfBirth);
    const hasAllergies = child.allergies && child.allergies.length > 0;

    return (
      <Box key={child.id} mb={3}>
        <Box bg="coolGray.800" rounded="xl" p={4} shadow={2}>
          <VStack space={2}>
            {/* Child Name and Age */}
            <HStack justifyContent="space-between" alignItems="center">
              <Heading color="white" size="md">
                {child.name}
              </Heading>
              <Badge bg="brand.500" rounded="full" px={3} py={1}>
                <Text color="white" fontSize="xs" fontWeight="600">
                  {age} {age === 1 ? "year" : "years"}
                </Text>
              </Badge>
            </HStack>

            {/* Date of Birth */}
            <HStack space={2} alignItems="center">
              <Icon
                as={MaterialIcons}
                name="cake"
                size="sm"
                color="coolGray.400"
              />
              <Text color="coolGray.400" fontSize="sm">
                Born:{" "}
                {new Date(child.dateOfBirth).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </HStack>

            {/* Allergies */}
            {hasAllergies && (
              <VStack space={1} mt={2}>
                <HStack space={2} alignItems="center">
                  <Icon
                    as={MaterialIcons}
                    name="warning"
                    size="sm"
                    color="red.400"
                  />
                  <Text color="red.400" fontSize="sm" fontWeight="600">
                    Allergies:
                  </Text>
                </HStack>
                <HStack flexWrap="wrap" space={2} mt={1}>
                  {child.allergies.map((allergy, index) => (
                    <Box
                      key={index}
                      bg="red.500"
                      px={3}
                      py={1}
                      rounded="full"
                      mb={1}
                    >
                      <Text color="white" fontSize="xs" fontWeight="500">
                        {allergy}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </VStack>
            )}
          </VStack>
        </Box>
        <Divider bg="coolGray.700" my={2} />
      </Box>
    );
  };

  return (
    <Box flex={1} bg="bg.900" safeArea>
      <ScrollView flex={1}>
        <VStack space={6} px={6} py={12}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Heading color="white" size="xl">
                Parent Portal
              </Heading>
              <Text color="coolGray.400" fontSize="md">
                Welcome, {userName || "Parent"}
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

          {/* Quick Actions */}
          <VStack space={4}>
            <Button
              bg="green.600"
              rounded="xl"
              py={4}
              onPress={() =>
                onNavigateToAddChild && onNavigateToAddChild()
              }
              _pressed={{ bg: "green.700" }}
            >
              <HStack space={3} alignItems="center">
                <Text fontSize="xl">👶</Text>
                <Text color="white" fontSize="md" fontWeight="500">
                  Add Child
                </Text>
              </HStack>
            </Button>


          </VStack>

          {/* Announcements Section */}
          <VStack space={4} mt={2}>
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

          {/* My Children Section */}
          <VStack space={4} mt={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Heading color="white" size="lg">
                My Children
              </Heading>
              <Badge bg="green.500" px={3} py={1} rounded="full">
                <Text color="white" fontSize="xs" fontWeight="600">
                  {children.length}{" "}
                  {children.length === 1 ? "Child" : "Children"}
                </Text>
              </Badge>
            </HStack>

            {/* Children List */}
            {loadingChildren ? (
              <Box py={10} alignItems="center">
                <Spinner size="lg" color="brand.500" />
                <Text color="coolGray.400" mt={4} fontSize="md">
                  Loading children...
                </Text>
              </Box>
            ) : children.length === 0 ? (
              <Box
                bg="coolGray.800"
                p={6}
                rounded="xl"
                borderWidth={1}
                borderColor="coolGray.700"
                alignItems="center"
              >
                <Icon
                  as={MaterialIcons}
                  name="child-care"
                  size="4xl"
                  color="coolGray.600"
                />
                <Text color="coolGray.500" fontSize="md" mt={4} textAlign="center">
                  No children registered yet
                </Text>
                <Text color="coolGray.600" fontSize="sm" mt={2} textAlign="center">
                  Click "Add Child" above to register your first child
                </Text>
              </Box>
            ) : (
              <VStack space={1}>
                {children.map((child) => renderChildCard(child))}
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
