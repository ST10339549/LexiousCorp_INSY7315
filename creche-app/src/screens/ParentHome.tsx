import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  ScrollView,
  Spinner,
  Badge,
  Divider,
  useToast,
  Pressable,
  IconButton,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { listenChildrenByParent, Child } from "../services/children";
import { subscribeAnnouncements, Announcement } from "../services/announcements";
import { 
  listenParentNotifications, 
  markNotificationAsRead, 
  Notification 
} from "../services/notifications";
import { AppCard, AppButton } from "../components/shared";
import { doc, getDoc } from "firebase/firestore";


type ParentHomeProps = {
  userName?: string;
  userId?: string;
  onLogout?: () => void;
  onNavigateToAddChild?: () => void;
  onNavigateToMyChildren?: () => void;
  onNavigateToAnnouncements?: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToLunchOrders?: () => void;
  onNavigateToPayments?: () => void;
  onNavigateToReceipts?: () => void;
};

export default function ParentHome({
  userName,
  userId,
  onLogout,
  onNavigateToAddChild,
  onNavigateToAnnouncements,
  onNavigateToEvents,
  onNavigateToLunchOrders,
  onNavigateToPayments,
  onNavigateToReceipts,
}: ParentHomeProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  
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
   * Subscribe to notifications updates
   */
  useEffect(() => {
    if (!userId) {
      setLoadingNotifications(false);
      return;
    }

    console.log("[ParentHome] Setting up notifications subscription");

    const unsubscribe = listenParentNotifications(userId, (updatedNotifications) => {
      console.log(`[ParentHome] Received ${updatedNotifications.length} notifications`);
      console.log('[ParentHome] All notifications:', updatedNotifications.map(n => ({ 
        id: n.id, 
        childName: n.childName, 
        read: n.read,
        timestamp: n.timestamp 
      })));
      // Only show latest 5 unread notifications
      const unreadNotifications = updatedNotifications.filter((n) => !n.read).slice(0, 5);
      console.log(`[ParentHome] Showing ${unreadNotifications.length} unread notifications`);
      setNotifications(unreadNotifications);
      setLoadingNotifications(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("[ParentHome] Cleaning up notifications subscription");
      unsubscribe();
    };
  }, [userId]);

  /**
   * Handle notification dismiss (mark as read)
   */
  const handleDismissNotification = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      toast.show({
        title: "Notification dismissed",
        duration: 2000,
        placement: "top",
        bg: "success.500",
      });
    } catch (error) {
      console.error("Error dismissing notification:", error);
      toast.show({
        title: "Failed to dismiss notification",
        duration: 3000,
        placement: "top",
        bg: "error.500",
      });
    }
  };

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
      <AppCard key={child.id} mb={3}>
        <VStack space={3}>
          {/* Child Name and Age */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={2} alignItems="center">
              <Box bg="primary.100" rounded="full" p={2}>
                <Ionicons name="person" size={24} color="#5C8DFF" />
              </Box>
              <Heading color="gray.800" size="md">
                {child.name}
              </Heading>
            </HStack>
            <Badge bg="accent.400" rounded="full" px={3} py={1}>
              <Text color="white" fontSize="xs" fontWeight="600">
                {age} {age === 1 ? "year" : "years"}
              </Text>
            </Badge>
          </HStack>

          {/* Date of Birth */}
          <HStack space={2} alignItems="center">
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text color="gray.600" fontSize="sm">
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
            <VStack space={2} mt={1}>
              <HStack space={2} alignItems="center">
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text color="error.500" fontSize="sm" fontWeight="600">
                  Allergies:
                </Text>
              </HStack>
              <HStack flexWrap="wrap" space={2}>
                {child.allergies.map((allergy, index) => (
                  <Badge
                    key={index}
                    bg="error.500"
                    rounded="full"
                    px={3}
                    py={1}
                  >
                    <Text color="white" fontSize="xs" fontWeight="500">
                      {allergy}
                    </Text>
                  </Badge>
                ))}
              </HStack>
            </VStack>
          )}
        </VStack>
      </AppCard>
    );
  };

  return (
    <Box flex={1} bg="background.secondary" safeArea>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={5} px={6} py={4}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center" mb={2}>
            <VStack>
              <Heading color="gray.800" size="xl" fontWeight="700">
                Parent Portal
              </Heading>
              <Text color="gray.500" fontSize="md" mt={1}>
                Welcome back, {userName || "Parent"}
              </Text>
            </VStack>
            <Pressable
              onPress={handleLogout}
              p={2}
              rounded="full"
              bg="error.50"
              _pressed={{ bg: "error.100" }}
            >
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            </Pressable>
          </HStack>

          {/* Quick Action Cards Grid */}
          <VStack space={3}>
            <Heading color="gray.800" size="sm" fontWeight="600">
              Quick Actions
            </Heading>
            
            <HStack space={3}>
              <Pressable
                flex={1}
                onPress={() => onNavigateToAddChild && onNavigateToAddChild()}
                _pressed={{ opacity: 0.7 }}
              >
                <Box bg="success.400" rounded="lg" p={4} shadow="sm">
                  <VStack space={2} alignItems="center">
                    <Ionicons name="person-add" size={28} color="white" />
                    <Text color="white" fontSize="xs" fontWeight="600" textAlign="center">
                      Add Child
                    </Text>
                  </VStack>
                </Box>
              </Pressable>

              <Pressable
                flex={1}
                onPress={() => onNavigateToEvents && onNavigateToEvents()}
                _pressed={{ opacity: 0.7 }}
              >
                <Box bg="primary.400" rounded="lg" p={4} shadow="sm">
                  <VStack space={2} alignItems="center">
                    <Ionicons name="calendar" size={28} color="white" />
                    <Text color="white" fontSize="xs" fontWeight="600" textAlign="center">
                      Events
                    </Text>
                  </VStack>
                </Box>
              </Pressable>

              <Pressable
                flex={1}
                onPress={() => onNavigateToLunchOrders && onNavigateToLunchOrders()}
                _pressed={{ opacity: 0.7 }}
              >
                <Box bg="warning.500" rounded="lg" p={4} shadow="sm">
                  <VStack space={2} alignItems="center">
                    <Ionicons name="restaurant" size={28} color="white" />
                    <Text color="white" fontSize="xs" fontWeight="600" textAlign="center">
                      Lunch
                    </Text>
                  </VStack>
                </Box>
              </Pressable>
            </HStack>

            <HStack space={3}>
              <Pressable
                flex={1}
                onPress={() => onNavigateToPayments && onNavigateToPayments()}
                _pressed={{ opacity: 0.7 }}
              >
                <Box bg="accent.400" rounded="lg" p={4} shadow="sm">
                  <VStack space={2} alignItems="center">
                    <Ionicons name="card" size={28} color="white" />
                    <Text color="white" fontSize="xs" fontWeight="600" textAlign="center">
                      Payments
                    </Text>
                  </VStack>
                </Box>
              </Pressable>

              <Pressable
                flex={1}
                onPress={() => onNavigateToReceipts && onNavigateToReceipts()}
                _pressed={{ opacity: 0.7 }}
              >
                <Box bg="info.500" rounded="lg" p={4} shadow="sm">
                  <VStack space={2} alignItems="center">
                    <Ionicons name="receipt" size={28} color="white" />
                    <Text color="white" fontSize="xs" fontWeight="600" textAlign="center">
                      Receipts
                    </Text>
                  </VStack>
                </Box>
              </Pressable>

              <Box flex={1} opacity={0}>
                {/* Placeholder for alignment */}
              </Box>
            </HStack>
          </VStack>

          {/* Notifications Section */}
          {notifications.length > 0 && (
            <VStack space={3} mt={2}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={2} alignItems="center">
                  <Ionicons name="notifications" size={20} color="#EF4444" />
                  <Heading color="gray.800" size="sm" fontWeight="600">
                    Alerts
                  </Heading>
                </HStack>
                <Badge bg="error.500" px={3} py={1} rounded="full">
                  <Text color="white" fontSize="xs" fontWeight="600">
                    {notifications.length}
                  </Text>
                </Badge>
              </HStack>

              {/* Notifications List */}
              <VStack space={3}>
                {notifications.map((notification) => (
                  <AppCard key={notification.id}>
                    <HStack justifyContent="space-between" alignItems="flex-start" space={2}>
                      <HStack flex={1} space={3} alignItems="flex-start">
                        <Box
                          bg="error.100"
                          rounded="full"
                          p={2}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Ionicons name="alert-circle" size={24} color="#EF4444" />
                        </Box>
                        <VStack flex={1} space={1}>
                          <Text color="gray.800" fontSize="md" fontWeight="600">
                            {notification.title}
                          </Text>
                          <Text color="gray.600" fontSize="sm">
                            {notification.message}
                          </Text>
                          <Text color="gray.400" fontSize="xs" mt={1}>
                            {formatDate(notification.timestamp)}
                          </Text>
                        </VStack>
                      </HStack>
                      <IconButton
                        icon={<Ionicons name="close" size={20} color="#9CA3AF" />}
                        onPress={() => handleDismissNotification(notification.id)}
                        variant="ghost"
                        size="sm"
                        _pressed={{ bg: "gray.100" }}
                      />
                    </HStack>
                  </AppCard>
                ))}
              </VStack>
            </VStack>
          )}

          {/* Announcements Section */}
          <VStack space={3} mt={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={2} alignItems="center">
                <Ionicons name="megaphone" size={20} color="#5C8DFF" />
                <Heading color="gray.800" size="sm" fontWeight="600">
                  Announcements
                </Heading>
              </HStack>
              {announcements.length > 0 && onNavigateToAnnouncements && (
                <Pressable
                  onPress={onNavigateToAnnouncements}
                  p={1}
                  _pressed={{ opacity: 0.6 }}
                >
                  <Text color="primary.400" fontSize="sm" fontWeight="600">
                    View All
                  </Text>
                </Pressable>
              )}
            </HStack>

            {/* Announcements List */}
            {loadingAnnouncements ? (
              <AppCard>
                <HStack space={3} justifyContent="center" py={4}>
                  <Spinner size="sm" color="primary.400" />
                  <Text color="gray.500">Loading announcements...</Text>
                </HStack>
              </AppCard>
            ) : announcements.length === 0 ? (
              <AppCard>
                <VStack space={2} alignItems="center" py={4}>
                  <Ionicons name="mail-open-outline" size={40} color="#D1D5DB" />
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
                        <Text
                          color="gray.800"
                          fontSize="md"
                          fontWeight="600"
                          flex={1}
                        >
                          {announcement.title}
                        </Text>
                        <Text color="gray.400" fontSize="xs" ml={2}>
                          {formatDate(announcement.createdAt)}
                        </Text>
                      </HStack>
                      <Text
                        color="gray.600"
                        fontSize="sm"
                        numberOfLines={2}
                      >
                        {announcement.body}
                      </Text>
                    </VStack>
                  </AppCard>
                ))}
              </VStack>
            )}
          </VStack>

          {/* My Children Section */}
          <VStack space={3} mt={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={2} alignItems="center">
                <Ionicons name="people" size={20} color="#5C8DFF" />
                <Heading color="gray.800" size="sm" fontWeight="600">
                  My Children
                </Heading>
              </HStack>
              <Badge bg="success.400" px={3} py={1} rounded="full">
                <Text color="white" fontSize="xs" fontWeight="600">
                  {children.length}
                </Text>
              </Badge>
            </HStack>

            {/* Children List */}
            {loadingChildren ? (
              <AppCard>
                <VStack space={3} alignItems="center" py={6}>
                  <Spinner size="lg" color="primary.400" />
                  <Text color="gray.500" fontSize="md">
                    Loading children...
                  </Text>
                </VStack>
              </AppCard>
            ) : children.length === 0 ? (
              <AppCard>
                <VStack space={3} alignItems="center" py={6}>
                  <Ionicons name="person-add-outline" size={48} color="#D1D5DB" />
                  <Text color="gray.500" fontSize="md" textAlign="center" fontWeight="500">
                    No children registered yet
                  </Text>
                  <Text color="gray.400" fontSize="sm" textAlign="center">
                    Tap "Add Child" to register your first child
                  </Text>
                </VStack>
              </AppCard>
            ) : (
              <VStack space={3}>
                {children.map((child) => renderChildCard(child))}
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
