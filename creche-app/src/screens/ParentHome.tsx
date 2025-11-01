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
import { MaterialIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { sendTestNotification } from "../services/notifications";

type ParentHomeProps = {
  userName?: string;
  userId?: string;
  onLogout?: () => void;
  onNavigateToAddChild?: () => void;
  onNavigateToMyChildren?: () => void;
};

export default function ParentHome({
  userName,
  userId,
  onLogout,
  onNavigateToAddChild,
}: ParentHomeProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
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
   * Send a test notification to the current user
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
