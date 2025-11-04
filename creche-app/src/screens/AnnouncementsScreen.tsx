/**
 * AnnouncementsScreen
 * 
 * Parent screen for viewing announcements.
 * Displays announcements sorted by creation date (newest first).
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  ScrollView,
  Spinner,
  Divider,
  Badge,
  IconButton,
  Icon,
} from "native-base";
import { BackHandler } from "react-native";
import { subscribeAnnouncements, Announcement } from "../services/announcements";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/shared";

type AnnouncementsScreenProps = {
  onBack?: () => void;
};

export default function AnnouncementsScreen({ onBack }: AnnouncementsScreenProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Subscribe to announcements updates
   */
  useEffect(() => {
    console.log("[AnnouncementsScreen] Setting up subscription for parents");

    const unsubscribe = subscribeAnnouncements(
      (updatedAnnouncements) => {
        console.log(`[AnnouncementsScreen] Received ${updatedAnnouncements.length} announcements`);
        setAnnouncements(updatedAnnouncements);
        setLoading(false);
      },
      undefined, // No limit - show all
      "parents" // Filter for parent-relevant announcements
    );

    // Cleanup subscription on unmount
    return () => {
      console.log("[AnnouncementsScreen] Cleaning up subscription");
      unsubscribe();
    };
  }, []);

  /**
   * Handle hardware back button
   */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onBack]);

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
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  /**
   * Get badge color based on audience
   */
  const getAudienceBadgeColor = (audience: string): string => {
    switch (audience) {
      case "all":
        return "purple";
      case "parents":
        return "green";
      case "staff":
        return "blue";
      default:
        return "gray";
    }
  };

  return (
    <Box bg="#F7F9FC" flex={1} safeArea>
      {/* Header */}
      <HStack
        bg="white"
        px={4}
        py={3}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="gray.200"
        shadow={1}
      >
        {onBack && (
          <IconButton
            icon={<Icon as={Ionicons} name="arrow-back" size="lg" color="gray.800" />}
            onPress={onBack}
            variant="ghost"
            _pressed={{ bg: "gray.100" }}
          />
        )}
        <Heading size="lg" color="gray.800" flex={1}>
          Announcements
        </Heading>
        <Icon as={Ionicons} name="megaphone" size={6} color="primary.400" />
      </HStack>

      {/* Content */}
      <ScrollView flex={1}>
        <VStack space={3} p={4}>
          {/* Loading State */}
          {loading && (
            <Box py={10} alignItems="center">
              <Spinner size="lg" color="primary.400" />
              <Text mt={3} color="gray.600">
                Loading announcements...
              </Text>
            </Box>
          )}

          {/* Empty State */}
          {!loading && announcements.length === 0 && (
            <AppCard alignItems="center" py={8}>
              <Icon as={Ionicons} name="notifications-off-outline" size={16} color="gray.300" mb={3} />
              <Text fontSize="lg" fontWeight="bold" color="gray.700">
                No Announcements
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                There are no announcements at this time.
              </Text>
            </AppCard>
          )}

          {/* Announcements List */}
          {!loading &&
            announcements.map((announcement) => (
              <AppCard key={announcement.id}>
                <VStack space={2}>
                  {/* Header with badge */}
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <VStack flex={1} space={1}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {announcement.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(announcement.createdAt)}
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={getAudienceBadgeColor(announcement.audience)}
                      variant="subtle"
                      borderRadius="md"
                      ml={2}
                    >
                      {announcement.audience === "all"
                        ? "All"
                        : announcement.audience === "parents"
                        ? "Parents"
                        : "Staff"}
                    </Badge>
                  </HStack>

                  <Divider />

                  {/* Body */}
                  <Text fontSize="sm" color="gray.700" lineHeight="sm">
                    {announcement.body}
                  </Text>
                </VStack>
              </AppCard>
            ))}

          {/* Info Box */}
          {!loading && announcements.length > 0 && (
            <Box bg="blue.50" p={3} borderRadius="md" borderWidth={1} borderColor="blue.200" mt={2}>
              <Text fontSize="xs" color="blue.800" textAlign="center">
                💡 You're viewing {announcements.length} announcement
                {announcements.length !== 1 ? "s" : ""}
              </Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
