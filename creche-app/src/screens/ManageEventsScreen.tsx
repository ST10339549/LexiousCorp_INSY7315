/**
 * ManageEventsScreen
 * 
 * Admin screen for managing events (CRUD operations).
 * Supports creating, editing, and deleting events with date/time pickers.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  TextArea,
  Heading,
  useToast,
  ScrollView,
  FormControl,
  IconButton,
  Modal,
  Divider,
  Spinner,
  Badge,
  Pressable,
  FlatList,
  Center,
} from "native-base";
import { BackHandler } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  subscribeEvents,
  Event,
  CreateEventData,
  UpdateEventData,
} from "../services/events";
import { Platform } from "react-native";

type ManageEventsScreenProps = {
  userId: string;
  onBack?: () => void;
};

export default function ManageEventsScreen({
  userId,
  onBack,
}: ManageEventsScreenProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<Date>(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState<Date>(new Date());

  const toast = useToast();

  /**
   * Generate calendar days for current month
   */
  const generateCalendarDays = (currentDate: Date) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  /**
   * Generate time options (hours and minutes)
   */
  const generateHours = () => Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const generateMinutes = () => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  /**
   * Subscribe to events
   */
  useEffect(() => {
    console.log("[ManageEventsScreen] Setting up events subscription");
    setLoadingEvents(true);

    const unsubscribe = subscribeEvents((updatedEvents) => {
      console.log(`[ManageEventsScreen] Received ${updatedEvents.length} events`);
      setEvents(updatedEvents);
      setLoadingEvents(false);
    });

    return () => {
      console.log("[ManageEventsScreen] Cleaning up events subscription");
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
   * Reset form
   */
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartsAt("");
    setEndsAt("");
    setLocation("");
    setSendNotification(true);
    setEditingEvent(null);
    setSelectedDate(new Date());
    setSelectedStartTime(new Date());
    setSelectedEndTime(new Date());
  };

  /**
   * Handle date confirmation from picker
   */
  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setSelectedDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setDate(formattedDate);
  };

  /**
   * Handle start time confirmation from picker
   */
  const handleStartTimeConfirm = (selectedTime: Date) => {
    setShowStartTimePicker(false);
    setSelectedStartTime(selectedTime);
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    setStartsAt(`${hours}:${minutes}`);
  };

  /**
   * Handle end time confirmation from picker
   */
  const handleEndTimeConfirm = (selectedTime: Date) => {
    setShowEndTimePicker(false);
    setSelectedEndTime(selectedTime);
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    setEndsAt(`${hours}:${minutes}`);
  };

  /**
   * Open create modal
   */
  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  /**
   * Open edit modal
   */
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setStartsAt(event.startsAt);
    setEndsAt(event.endsAt);
    setLocation(event.location);
    setSendNotification(false); // Don't send notification on edit by default
    
    // Set picker date objects
    setSelectedDate(new Date(event.date));
    
    const [startHours, startMinutes] = event.startsAt.split(':');
    const startTime = new Date();
    startTime.setHours(parseInt(startHours), parseInt(startMinutes));
    setSelectedStartTime(startTime);
    
    const [endHours, endMinutes] = event.endsAt.split(':');
    const endTime = new Date();
    endTime.setHours(parseInt(endHours), parseInt(endMinutes));
    setSelectedEndTime(endTime);
    
    setShowModal(true);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = async () => {
    // Validate inputs
    if (!title.trim()) {
      toast.show({
        title: "Title Required",
        description: "Please enter an event title",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (!description.trim()) {
      toast.show({
        title: "Description Required",
        description: "Please enter an event description",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (!date.trim()) {
      toast.show({
        title: "Date Required",
        description: "Please enter an event date (YYYY-MM-DD)",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (!startsAt.trim()) {
      toast.show({
        title: "Start Time Required",
        description: "Please enter a start time (HH:MM)",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (!endsAt.trim()) {
      toast.show({
        title: "End Time Required",
        description: "Please enter an end time (HH:MM)",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (!location.trim()) {
      toast.show({
        title: "Location Required",
        description: "Please enter an event location",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingEvent) {
        // Update existing event
        const updateData: UpdateEventData = {
          title: title.trim(),
          description: description.trim(),
          date: date.trim(),
          startsAt: startsAt.trim(),
          endsAt: endsAt.trim(),
          location: location.trim(),
        };

        await updateEvent(editingEvent.id, updateData);

        toast.show({
          title: "✅ Event Updated!",
          description: "Event has been updated successfully",
          placement: "top",
          duration: 3000,
          bg: "green.500",
        });
      } else {
        // Create new event
        const eventData: CreateEventData = {
          title: title.trim(),
          description: description.trim(),
          date: date.trim(),
          startsAt: startsAt.trim(),
          endsAt: endsAt.trim(),
          location: location.trim(),
          createdBy: userId,
        };

        await createEvent(eventData, sendNotification);

        toast.show({
          title: "✅ Event Created!",
          description: sendNotification
            ? "Event created and notifications sent to parents"
            : "Event created successfully",
          placement: "top",
          duration: 3000,
          bg: "green.500",
        });
      }

      // Close modal and reset form
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("❌ Error saving event:", error);

      toast.show({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save event",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle event deletion
   */
  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    try {
      await deleteEvent(eventId);

      toast.show({
        title: "✅ Event Deleted",
        description: "Event has been deleted successfully",
        placement: "top",
        duration: 3000,
        bg: "green.500",
      });
    } catch (error) {
      console.error("❌ Error deleting event:", error);

      toast.show({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete event",
        placement: "top",
        bg: "red.500",
      });
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Check if event is in the past
   */
  const isPastEvent = (dateString: string): boolean => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  return (
    <ScrollView bg="coolGray.50" flex={1}>
      <Box safeArea p={4}>
        <VStack space={4}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color="primary.700">
              📅 Manage Events
            </Heading>
            <HStack space={2}>
              <Button
                leftIcon={<MaterialIcons name="add" size={20} color="white" />}
                onPress={handleCreate}
                colorScheme="primary"
              >
                Add Event
              </Button>
              {onBack && (
                <Button variant="ghost" onPress={onBack}>
                  Back
                </Button>
              )}
            </HStack>
          </HStack>

          {/* Info Box */}
          <Box bg="blue.50" p={3} borderRadius="md" borderWidth={1} borderColor="blue.200">
            <Text fontSize="sm" color="blue.800">
              💡 Create events for parents to view. Optionally send push notifications
              when creating new events.
            </Text>
          </Box>

          {/* Events List */}
          <VStack space={3}>
            {loadingEvents ? (
              <Box alignItems="center" py={8}>
                <Spinner size="lg" color="primary.500" />
                <Text mt={2} color="gray.500">
                  Loading events...
                </Text>
              </Box>
            ) : events.length === 0 ? (
              <Box bg="white" p={6} borderRadius="lg" shadow={1} alignItems="center">
                <Text fontSize="lg" color="gray.500" textAlign="center">
                  📭 No events yet
                </Text>
                <Text fontSize="sm" color="gray.400" mt={2} textAlign="center">
                  Create your first event to get started
                </Text>
              </Box>
            ) : (
              events.map((event) => (
                <Box
                  key={event.id}
                  bg="white"
                  p={4}
                  borderRadius="lg"
                  shadow={1}
                  opacity={isPastEvent(event.date) ? 0.6 : 1}
                >
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <VStack flex={1} space={2}>
                      <HStack alignItems="center" space={2}>
                        <Text fontSize="lg" fontWeight="bold" color="primary.700">
                          {event.title}
                        </Text>
                        {isPastEvent(event.date) && (
                          <Badge colorScheme="gray" variant="subtle">
                            Past
                          </Badge>
                        )}
                      </HStack>

                      <Text fontSize="sm" color="gray.600">
                        {event.description}
                      </Text>

                      <Divider my={1} />

                      <VStack space={1}>
                        <HStack alignItems="center" space={2}>
                          <MaterialIcons name="event" size={16} color="#4B5563" />
                          <Text fontSize="sm" color="gray.600">
                            {formatDate(event.date)}
                          </Text>
                        </HStack>

                        <HStack alignItems="center" space={2}>
                          <MaterialIcons name="schedule" size={16} color="#4B5563" />
                          <Text fontSize="sm" color="gray.600">
                            {event.startsAt} - {event.endsAt}
                          </Text>
                        </HStack>

                        <HStack alignItems="center" space={2}>
                          <MaterialIcons name="place" size={16} color="#4B5563" />
                          <Text fontSize="sm" color="gray.600">
                            {event.location}
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>

                    <VStack space={2}>
                      <IconButton
                        icon={<MaterialIcons name="edit" size={20} color="#3B82F6" />}
                        onPress={() => handleEdit(event)}
                        variant="ghost"
                        _pressed={{ bg: "blue.100" }}
                      />
                      <IconButton
                        icon={<MaterialIcons name="delete" size={20} color="#EF4444" />}
                        onPress={() => handleDelete(event.id, event.title)}
                        variant="ghost"
                        _pressed={{ bg: "red.100" }}
                      />
                    </VStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </VStack>
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="full">
        <Modal.Content maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header>
            {editingEvent ? "✏️ Edit Event" : "➕ Create Event"}
          </Modal.Header>
          <Modal.Body>
            <ScrollView>
              <VStack space={4}>
                {/* Title Input */}
                <FormControl isRequired>
                  <FormControl.Label>
                    <Text fontWeight="bold">Title</Text>
                  </FormControl.Label>
                  <Input
                    placeholder="e.g., Parent-Teacher Meeting"
                    value={title}
                    onChangeText={setTitle}
                    isDisabled={isSubmitting}
                    size="lg"
                  />
                </FormControl>

                {/* Description Input */}
                <FormControl isRequired>
                  <FormControl.Label>
                    <Text fontWeight="bold">Description</Text>
                  </FormControl.Label>
                  <TextArea
                    placeholder="Enter event details..."
                    value={description}
                    onChangeText={setDescription}
                    isDisabled={isSubmitting}
                    h={100}
                    autoCompleteType={undefined}
                  />
                </FormControl>

                {/* Date Input */}
                <FormControl isRequired>
                  <FormControl.Label>
                    <Text fontWeight="bold">Date</Text>
                  </FormControl.Label>
                  <Pressable onPress={() => setShowDatePicker(true)} isDisabled={isSubmitting}>
                    <Box
                      borderWidth={1}
                      borderColor="coolGray.300"
                      borderRadius="md"
                      p={3}
                      bg={isSubmitting ? "coolGray.100" : "white"}
                    >
                      <HStack alignItems="center" justifyContent="space-between">
                        <Text color={date ? "gray.800" : "gray.400"}>
                          {date ? new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : "Select date"}
                        </Text>
                        <MaterialIcons name="calendar-today" size={20} color="#3B82F6" />
                      </HStack>
                    </Box>
                  </Pressable>
                </FormControl>

                {/* Start Time Input */}
                <FormControl isRequired>
                  <FormControl.Label>
                    <Text fontWeight="bold">Start Time</Text>
                  </FormControl.Label>
                  <Pressable onPress={() => setShowStartTimePicker(true)} isDisabled={isSubmitting}>
                    <Box
                      borderWidth={1}
                      borderColor="coolGray.300"
                      borderRadius="md"
                      p={3}
                      bg={isSubmitting ? "coolGray.100" : "white"}
                    >
                      <HStack alignItems="center" justifyContent="space-between">
                        <Text color={startsAt ? "gray.800" : "gray.400"}>
                          {startsAt || "Select start time"}
                        </Text>
                        <MaterialIcons name="access-time" size={20} color="#3B82F6" />
                      </HStack>
                    </Box>
                  </Pressable>
                </FormControl>

                {/* End Time Input */}
                <FormControl isRequired>
                  <FormControl.Label>
                    <Text fontWeight="bold">End Time</Text>
                  </FormControl.Label>
                  <Pressable onPress={() => setShowEndTimePicker(true)} isDisabled={isSubmitting}>
                    <Box
                      borderWidth={1}
                      borderColor="coolGray.300"
                      borderRadius="md"
                      p={3}
                      bg={isSubmitting ? "coolGray.100" : "white"}
                    >
                      <HStack alignItems="center" justifyContent="space-between">
                        <Text color={endsAt ? "gray.800" : "gray.400"}>
                          {endsAt || "Select end time"}
                        </Text>
                        <MaterialIcons name="access-time" size={20} color="#3B82F6" />
                      </HStack>
                    </Box>
                  </Pressable>
                </FormControl>

                {/* Location Input */}
                <FormControl isRequired>
                  <FormControl.Label>
                    <Text fontWeight="bold">Location</Text>
                  </FormControl.Label>
                  <Input
                    placeholder="e.g., Main Hall"
                    value={location}
                    onChangeText={setLocation}
                    isDisabled={isSubmitting}
                  />
                </FormControl>

                {/* Send Notification Toggle (only for new events) */}
                {!editingEvent && (
                  <Box>
                    <HStack alignItems="center" justifyContent="space-between">
                      <Text fontWeight="bold">Send Notification to Parents</Text>
                      <Button
                        size="sm"
                        variant={sendNotification ? "solid" : "outline"}
                        colorScheme={sendNotification ? "green" : "gray"}
                        onPress={() => setSendNotification(!sendNotification)}
                      >
                        {sendNotification ? "Yes" : "No"}
                      </Button>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {sendNotification
                        ? "Parents will receive a push notification about this event"
                        : "Event will be created silently"}
                    </Text>
                  </Box>
                )}
              </VStack>
            </ScrollView>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                onPress={() => setShowModal(false)}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isLoadingText="Saving..."
                colorScheme="primary"
              >
                {editingEvent ? "Update" : "Create"}
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Date Picker Modal */}
      <Modal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} size="lg">
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Select Date</Modal.Header>
          <Modal.Body>
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <IconButton
                  icon={<MaterialIcons name="chevron-left" size={24} />}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                />
                <Text fontSize="lg" fontWeight="bold">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <IconButton
                  icon={<MaterialIcons name="chevron-right" size={24} />}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                />
              </HStack>

              {/* Day headers */}
              <HStack justifyContent="space-around">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <Box key={day} width="40px">
                    <Text textAlign="center" fontWeight="bold" fontSize="xs" color="gray.600">
                      {day}
                    </Text>
                  </Box>
                ))}
              </HStack>

              {/* Calendar days */}
              <Box flexWrap="wrap" flexDirection="row">
                {generateCalendarDays(selectedDate).map((day, index) => {
                  if (day === null) {
                    return <Box key={`empty-${index}`} width="40px" height="40px" />;
                  }
                  
                  const isSelected = day === selectedDate.getDate() && 
                    selectedDate.getMonth() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).getMonth();
                  
                  return (
                    <Pressable
                      key={`day-${day}`}
                      onPress={() => {
                        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                        setSelectedDate(newDate);
                      }}
                    >
                      <Box
                        width="40px"
                        height="40px"
                        justifyContent="center"
                        alignItems="center"
                        bg={isSelected ? "primary.500" : "transparent"}
                        borderRadius="full"
                        m={1}
                      >
                        <Text color={isSelected ? "white" : "gray.800"} fontWeight={isSelected ? "bold" : "normal"}>
                          {day}
                        </Text>
                      </Box>
                    </Pressable>
                  );
                })}
              </Box>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowDatePicker(false)}>
                Cancel
              </Button>
              <Button onPress={() => handleDateConfirm(selectedDate)} colorScheme="primary">
                Confirm
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Start Time Picker Modal */}
      <Modal isOpen={showStartTimePicker} onClose={() => setShowStartTimePicker(false)} size="lg">
        <Modal.Content maxWidth="300px">
          <Modal.CloseButton />
          <Modal.Header>Select Start Time</Modal.Header>
          <Modal.Body>
            <HStack space={2} justifyContent="center" alignItems="center">
              {/* Hours Picker */}
              <VStack space={2} flex={1}>
                <Text textAlign="center" fontWeight="bold" fontSize="sm">Hours</Text>
                <ScrollView maxH="200px">
                  <VStack space={1}>
                    {generateHours().map((hour) => (
                      <Pressable
                        key={`hour-${hour}`}
                        onPress={() => {
                          const newTime = new Date(selectedStartTime);
                          newTime.setHours(parseInt(hour));
                          setSelectedStartTime(newTime);
                        }}
                      >
                        <Box
                          py={2}
                          px={3}
                          bg={selectedStartTime.getHours() === parseInt(hour) ? "primary.100" : "transparent"}
                          borderRadius="md"
                        >
                          <Text
                            textAlign="center"
                            fontSize="lg"
                            fontWeight={selectedStartTime.getHours() === parseInt(hour) ? "bold" : "normal"}
                            color={selectedStartTime.getHours() === parseInt(hour) ? "primary.700" : "gray.700"}
                          >
                            {hour}
                          </Text>
                        </Box>
                      </Pressable>
                    ))}
                  </VStack>
                </ScrollView>
              </VStack>

              <Text fontSize="2xl" fontWeight="bold">:</Text>

              {/* Minutes Picker */}
              <VStack space={2} flex={1}>
                <Text textAlign="center" fontWeight="bold" fontSize="sm">Minutes</Text>
                <ScrollView maxH="200px">
                  <VStack space={1}>
                    {generateMinutes().filter((_, i) => i % 5 === 0).map((minute) => (
                      <Pressable
                        key={`minute-${minute}`}
                        onPress={() => {
                          const newTime = new Date(selectedStartTime);
                          newTime.setMinutes(parseInt(minute));
                          setSelectedStartTime(newTime);
                        }}
                      >
                        <Box
                          py={2}
                          px={3}
                          bg={selectedStartTime.getMinutes() === parseInt(minute) ? "primary.100" : "transparent"}
                          borderRadius="md"
                        >
                          <Text
                            textAlign="center"
                            fontSize="lg"
                            fontWeight={selectedStartTime.getMinutes() === parseInt(minute) ? "bold" : "normal"}
                            color={selectedStartTime.getMinutes() === parseInt(minute) ? "primary.700" : "gray.700"}
                          >
                            {minute}
                          </Text>
                        </Box>
                      </Pressable>
                    ))}
                  </VStack>
                </ScrollView>
              </VStack>
            </HStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowStartTimePicker(false)}>
                Cancel
              </Button>
              <Button onPress={() => handleStartTimeConfirm(selectedStartTime)} colorScheme="primary">
                Confirm
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal isOpen={showEndTimePicker} onClose={() => setShowEndTimePicker(false)} size="lg">
        <Modal.Content maxWidth="300px">
          <Modal.CloseButton />
          <Modal.Header>Select End Time</Modal.Header>
          <Modal.Body>
            <HStack space={2} justifyContent="center" alignItems="center">
              {/* Hours Picker */}
              <VStack space={2} flex={1}>
                <Text textAlign="center" fontWeight="bold" fontSize="sm">Hours</Text>
                <ScrollView maxH="200px">
                  <VStack space={1}>
                    {generateHours().map((hour) => (
                      <Pressable
                        key={`hour-${hour}`}
                        onPress={() => {
                          const newTime = new Date(selectedEndTime);
                          newTime.setHours(parseInt(hour));
                          setSelectedEndTime(newTime);
                        }}
                      >
                        <Box
                          py={2}
                          px={3}
                          bg={selectedEndTime.getHours() === parseInt(hour) ? "primary.100" : "transparent"}
                          borderRadius="md"
                        >
                          <Text
                            textAlign="center"
                            fontSize="lg"
                            fontWeight={selectedEndTime.getHours() === parseInt(hour) ? "bold" : "normal"}
                            color={selectedEndTime.getHours() === parseInt(hour) ? "primary.700" : "gray.700"}
                          >
                            {hour}
                          </Text>
                        </Box>
                      </Pressable>
                    ))}
                  </VStack>
                </ScrollView>
              </VStack>

              <Text fontSize="2xl" fontWeight="bold">:</Text>

              {/* Minutes Picker */}
              <VStack space={2} flex={1}>
                <Text textAlign="center" fontWeight="bold" fontSize="sm">Minutes</Text>
                <ScrollView maxH="200px">
                  <VStack space={1}>
                    {generateMinutes().filter((_, i) => i % 5 === 0).map((minute) => (
                      <Pressable
                        key={`minute-${minute}`}
                        onPress={() => {
                          const newTime = new Date(selectedEndTime);
                          newTime.setMinutes(parseInt(minute));
                          setSelectedEndTime(newTime);
                        }}
                      >
                        <Box
                          py={2}
                          px={3}
                          bg={selectedEndTime.getMinutes() === parseInt(minute) ? "primary.100" : "transparent"}
                          borderRadius="md"
                        >
                          <Text
                            textAlign="center"
                            fontSize="lg"
                            fontWeight={selectedEndTime.getMinutes() === parseInt(minute) ? "bold" : "normal"}
                            color={selectedEndTime.getMinutes() === parseInt(minute) ? "primary.700" : "gray.700"}
                          >
                            {minute}
                          </Text>
                        </Box>
                      </Pressable>
                    ))}
                  </VStack>
                </ScrollView>
              </VStack>
            </HStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowEndTimePicker(false)}>
                Cancel
              </Button>
              <Button onPress={() => handleEndTimeConfirm(selectedEndTime)} colorScheme="primary">
                Confirm
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
}
