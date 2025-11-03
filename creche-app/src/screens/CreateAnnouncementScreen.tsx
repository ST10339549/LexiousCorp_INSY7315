/**
 * CreateAnnouncementScreen
 * 
 * Admin screen for creating announcements that will be sent to parents and/or staff.
 * Supports audience targeting and automatic push notifications.
 */

import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  TextArea,
  Select,
  CheckIcon,
  Heading,
  useToast,
  ScrollView,
  FormControl,
} from "native-base";
import { createAnnouncement, AnnouncementAudience } from "../services/announcements";

type CreateAnnouncementScreenProps = {
  onBack?: () => void;
  onAnnouncementCreated?: () => void;
};

export default function CreateAnnouncementScreen({
  onBack,
  onAnnouncementCreated,
}: CreateAnnouncementScreenProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate inputs
    if (!title.trim()) {
      toast.show({
        title: "Title Required",
        description: "Please enter an announcement title",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (!body.trim()) {
      toast.show({
        title: "Body Required",
        description: "Please enter announcement content",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Creating announcement:", { title, body, audience });

      // Create announcement (this will also send notifications)
      const announcementId = await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
      });

      console.log("✅ Announcement created:", announcementId);

      // Show success message
      toast.show({
        title: "✅ Announcement Created!",
        description: `Notifications sent to ${audience === 'all' ? 'all users' : audience}`,
        placement: "top",
        duration: 3000,
        bg: "green.500",
      });

      // Reset form
      setTitle("");
      setBody("");
      setAudience("all");

      // Navigate back or trigger callback
      if (onAnnouncementCreated) {
        onAnnouncementCreated();
      } else if (onBack) {
        // Wait a moment for user to see success message
        setTimeout(() => {
          onBack();
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Error creating announcement:", error);
      
      toast.show({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create announcement",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get audience description
   */
  const getAudienceDescription = (aud: AnnouncementAudience): string => {
    switch (aud) {
      case "all":
        return "All users (parents, staff, and admins)";
      case "parents":
        return "Parents only";
      case "staff":
        return "Staff and admins only";
      case "admin":
        return "Admins only";
      default:
        return "";
    }
  };

  return (
    <ScrollView bg="coolGray.50" flex={1}>
      <Box safeArea p={4}>
        <VStack space={4}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color="primary.700">
              📢 Create Announcement
            </Heading>
            {onBack && (
              <Button variant="ghost" onPress={onBack} isDisabled={isSubmitting}>
                Back
              </Button>
            )}
          </HStack>

          {/* Info Box */}
          <Box bg="blue.50" p={3} borderRadius="md" borderWidth={1} borderColor="blue.200">
            <Text fontSize="sm" color="blue.800">
              💡 Announcements will be saved and push notifications will be sent to
              the selected audience.
            </Text>
          </Box>

          {/* Form */}
          <Box bg="white" p={4} borderRadius="lg" shadow={2}>
            <VStack space={4}>
              {/* Title Input */}
              <FormControl isRequired>
                <FormControl.Label>
                  <Text fontWeight="bold">Title</Text>
                </FormControl.Label>
                <Input
                  placeholder="e.g., School Closure Notice"
                  value={title}
                  onChangeText={setTitle}
                  isDisabled={isSubmitting}
                  size="lg"
                  maxLength={100}
                />
                <FormControl.HelperText>
                  {title.length}/100 characters
                </FormControl.HelperText>
              </FormControl>

              {/* Body Input */}
              <FormControl isRequired>
                <FormControl.Label>
                  <Text fontWeight="bold">Message</Text>
                </FormControl.Label>
                <TextArea
                  placeholder="Enter the announcement details..."
                  value={body}
                  onChangeText={setBody}
                  isDisabled={isSubmitting}
                  h={150}
                  maxLength={500}
                  autoCompleteType={undefined}
                />
                <FormControl.HelperText>
                  {body.length}/500 characters
                </FormControl.HelperText>
              </FormControl>

              {/* Audience Selector */}
              <FormControl isRequired>
                <FormControl.Label>
                  <Text fontWeight="bold">Target Audience</Text>
                </FormControl.Label>
                <Select
                  selectedValue={audience}
                  onValueChange={(value) => setAudience(value as AnnouncementAudience)}
                  isDisabled={isSubmitting}
                  _selectedItem={{
                    bg: "primary.100",
                    endIcon: <CheckIcon size={4} />,
                  }}
                  size="lg"
                >
                  <Select.Item label="All Users" value="all" />
                  <Select.Item label="Parents Only" value="parents" />
                  <Select.Item label="Staff Only" value="staff" />
                  <Select.Item label="Admins Only" value="admin" />
                </Select>
                <FormControl.HelperText>
                  {getAudienceDescription(audience)}
                </FormControl.HelperText>
              </FormControl>
            </VStack>
          </Box>

          {/* Preview Box */}
          {(title.trim() || body.trim()) && (
            <Box bg="gray.100" p={4} borderRadius="lg" borderWidth={1} borderColor="gray.300">
              <VStack space={2}>
                <Text fontSize="xs" color="gray.600" fontWeight="bold">
                  PREVIEW
                </Text>
                <Text fontSize="md" fontWeight="bold" color="gray.800">
                  📢 {title || "(No title)"}
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {body || "(No message)"}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  To: {getAudienceDescription(audience)}
                </Text>
              </VStack>
            </Box>
          )}

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isLoadingText="Creating..."
            size="lg"
            colorScheme="primary"
            mt={2}
            isDisabled={!title.trim() || !body.trim()}
          >
            📢 Create & Send Announcement
          </Button>

          {/* Help Text */}
          <Box bg="amber.50" p={3} borderRadius="md" borderWidth={1} borderColor="amber.200">
            <VStack space={1}>
              <Text fontSize="xs" fontWeight="bold" color="amber.800">
                📌 How it works:
              </Text>
              <Text fontSize="xs" color="amber.700">
                • Announcement is saved to the database
              </Text>
              <Text fontSize="xs" color="amber.700">
                • Push notifications are sent immediately
              </Text>
              <Text fontSize="xs" color="amber.700">
                • Users can view all announcements in their app
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
}
