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
  Button,
  Heading,
  ScrollView,
  Spinner,
  Divider,
  Badge,
} from "native-base";
import { BackHandler } from "react-native";
import { subscribeAnnouncements, Announcement } from "../services/announcements";

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
    <Box bg="coolGray.50" flex={1} safeArea>
      {/* Header */}
      <HStack
        bg="white"
        px={4}
        py={3}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="coolGray.200"
      >
        <Heading size="lg" color="primary.700">
          📢 Announcements
        </Heading>
        {onBack && (
          <Button variant="ghost" onPress={onBack}>
            Back
          </Button>
        )}
      </HStack>

      {/* Content */}
      <ScrollView flex={1}>
        <VStack space={3} p={4}>
          {/* Loading State */}
          {loading && (
            <Box py={10} alignItems="center">
              <Spinner size="lg" color="primary.500" />
              <Text mt={3} color="gray.600">
                Loading announcements...
              </Text>
            </Box>
          )}

          {/* Empty State */}
          {!loading && announcements.length === 0 && (
            <Box bg="white" p={8} borderRadius="lg" alignItems="center">
              <Text fontSize="4xl" mb={2}>
                📭
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="gray.700">
                No Announcements
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                There are no announcements at this time.
              </Text>
            </Box>
          )}

          {/* Announcements List */}
          {!loading &&
            announcements.map((announcement) => (
              <Box
                key={announcement.id}
                bg="white"
                p={4}
                borderRadius="lg"
                shadow={1}
                borderWidth={1}
                borderColor="coolGray.200"
              >
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
              </Box>
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
