/**
 * ParentEventsCalendar
 * 
 * Parent screen for viewing events in a calendar view.
 * Uses react-native-calendars for calendar display with event dots.
 * Tap on a date to see events for that day.
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
import { Calendar, DateData } from "react-native-calendars";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppCard } from "../components/shared";
import { subscribeEvents, Event } from "../services/events";

type ParentEventsCalendarProps = {
  onBack?: () => void;
};

export default function ParentEventsCalendar({
  onBack,
}: ParentEventsCalendarProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [markedDates, setMarkedDates] = useState<any>({});

  /**
   * Subscribe to events (upcoming and recent)
   */
  useEffect(() => {
    console.log("[ParentEventsCalendar] Setting up events subscription");
    setLoadingEvents(true);

    // Subscribe to events from 1 month ago to 6 months ahead
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const sixMonthsAhead = new Date(today);
    sixMonthsAhead.setMonth(today.getMonth() + 6);

    const startDate = oneMonthAgo.toISOString().split("T")[0];
    const endDate = sixMonthsAhead.toISOString().split("T")[0];

    const unsubscribe = subscribeEvents(
      (updatedEvents) => {
        console.log(`[ParentEventsCalendar] Received ${updatedEvents.length} events`);
        setEvents(updatedEvents);
        setLoadingEvents(false);

        // Mark dates with events
        updateMarkedDates(updatedEvents);
      },
      startDate,
      endDate
    );

    return () => {
      console.log("[ParentEventsCalendar] Cleaning up events subscription");
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
   * Update marked dates for calendar
   */
  const updateMarkedDates = (eventsList: Event[]) => {
    const marked: any = {};

    eventsList.forEach((event) => {
      const dateKey = event.date;
      if (!marked[dateKey]) {
        marked[dateKey] = {
          marked: true,
          dotColor: "transparent", // Hide the dot
          customStyles: {
            container: {
              borderWidth: 2,
              borderColor: "#3B82F6",
              borderRadius: 16,
            },
            text: {
              color: "#3B82F6",
              fontWeight: "bold",
            },
          },
        };
      }
    });

    // Also mark selected date if one is selected
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#3B82F6",
        customStyles: marked[selectedDate]?.customStyles || undefined,
      };
    }

    setMarkedDates(marked);
  };

  /**
   * Handle date selection
   */
  const handleDateSelect = (day: DateData) => {
    const dateKey = day.dateString;
    setSelectedDate(dateKey);

    // Update marked dates with selection
    const marked: any = {};
    events.forEach((event) => {
      const eventDateKey = event.date;
      if (eventDateKey === dateKey) {
        marked[eventDateKey] = {
          marked: true,
          selected: true,
          selectedColor: "#3B82F6",
          dotColor: "transparent",
          customStyles: {
            container: {
              borderWidth: 2,
              borderColor: "#FFFFFF",
              borderRadius: 16,
            },
            text: {
              color: "#FFFFFF",
              fontWeight: "bold",
            },
          },
        };
      } else {
        marked[eventDateKey] = {
          marked: true,
          dotColor: "transparent",
          customStyles: {
            container: {
              borderWidth: 2,
              borderColor: "#3B82F6",
              borderRadius: 16,
            },
            text: {
              color: "#3B82F6",
              fontWeight: "bold",
            },
          },
        };
      }
    });

    // Also mark selected date even if no events
    if (!marked[dateKey]) {
      marked[dateKey] = {
        selected: true,
        selectedColor: "#3B82F6",
      };
    }

    setMarkedDates(marked);
  };

  /**
   * Get events for selected date
   */
  const getEventsForDate = (date: string): Event[] => {
    return events.filter((event) => event.date === date);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Check if event is today
   */
  const isToday = (dateString: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
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

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const todayString = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter(
    (event) => event.date >= todayString
  ).slice(0, 5);

  return (
    <ScrollView bg="coolGray.50" flex={1}>
      <Box safeArea p={4}>
        <VStack space={4}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color="primary.700">
              📅 Events Calendar
            </Heading>
            {onBack && (
              <Button variant="ghost" onPress={onBack}>
                Back
              </Button>
            )}
          </HStack>

          {/* Info Box */}
          <Box bg="blue.50" p={3} borderRadius="md" borderWidth={1} borderColor="blue.200">
            <Text fontSize="sm" color="blue.800">
              💡 Tap on a date with a blue circle to view events for that day
            </Text>
          </Box>

          {/* Calendar */}
          {loadingEvents ? (
            <Box bg="white" p={6} borderRadius="lg" shadow={2} alignItems="center">
              <Spinner size="lg" color="primary.500" />
              <Text mt={2} color="gray.500">
                Loading events...
              </Text>
            </Box>
          ) : (
            <Box bg="white" borderRadius="lg" shadow={2} overflow="hidden">
              <Calendar
                markedDates={markedDates}
                onDayPress={handleDateSelect}
                markingType="custom"
                theme={{
                  backgroundColor: "#ffffff",
                  calendarBackground: "#ffffff",
                  textSectionTitleColor: "#4B5563",
                  selectedDayBackgroundColor: "#3B82F6",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#3B82F6",
                  dayTextColor: "#1F2937",
                  textDisabledColor: "#D1D5DB",
                  dotColor: "#3B82F6",
                  selectedDotColor: "#ffffff",
                  arrowColor: "#3B82F6",
                  monthTextColor: "#1F2937",
                  textDayFontWeight: "400",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
              />
            </Box>
          )}

          {/* Selected Date Events */}
          {selectedDate && (
            <VStack space={3}>
              <Heading size="md" color="primary.700">
                {formatDate(selectedDate)}
                {isToday(selectedDate) && (
                  <Text color="blue.500" fontSize="sm">
                    {" "}
                    (Today)
                  </Text>
                )}
              </Heading>

              {selectedEvents.length === 0 ? (
                <Box bg="white" p={4} borderRadius="lg" shadow={1} alignItems="center">
                  <Text color="gray.500">No events on this day</Text>
                </Box>
              ) : (
                selectedEvents.map((event) => (
                  <Box key={event.id} bg="white" p={4} borderRadius="lg" shadow={1}>
                    <VStack space={2}>
                      <HStack alignItems="center" space={2}>
                        <Text fontSize="lg" fontWeight="bold" color="primary.700" flex={1}>
                          {event.title}
                        </Text>
                        {isPastEvent(event.date) && (
                          <Badge colorScheme="gray" variant="subtle">
                            Past
                          </Badge>
                        )}
                        {isToday(event.date) && (
                          <Badge colorScheme="blue" variant="subtle">
                            Today
                          </Badge>
                        )}
                      </HStack>

                      <Text fontSize="sm" color="gray.600">
                        {event.description}
                      </Text>

                      <Divider my={1} />

                      <HStack alignItems="center" space={2}>
                        <Ionicons name="time-outline" size={16} color="#4B5563" />
                        <Text fontSize="sm" color="gray.600">
                          {event.startsAt} - {event.endsAt}
                        </Text>
                      </HStack>

                      <HStack alignItems="center" space={2}>
                        <Ionicons name="location-outline" size={16} color="#4B5563" />
                        <Text fontSize="sm" color="gray.600">
                          {event.location}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                ))
              )}
            </VStack>
          )}

          {/* Upcoming Events Section */}
          {!selectedDate && upcomingEvents.length > 0 && (
            <VStack space={3}>
              <Heading size="md" color="primary.700">
                Upcoming Events
              </Heading>

              {upcomingEvents.map((event) => (
                <Box key={event.id} bg="white" p={4} borderRadius="lg" shadow={1}>
                  <VStack space={2}>
                    <HStack alignItems="center" space={2}>
                      <Text fontSize="lg" fontWeight="bold" color="primary.700" flex={1}>
                        {event.title}
                      </Text>
                      {isToday(event.date) && (
                        <Badge colorScheme="blue" variant="subtle">
                          Today
                        </Badge>
                      )}
                    </HStack>

                    <Text fontSize="sm" color="gray.600">
                      {event.description}
                    </Text>

                    <Divider my={1} />

                    <HStack alignItems="center" space={2}>
                      <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                      <Text fontSize="sm" color="gray.600">
                        {formatDate(event.date)}
                      </Text>
                    </HStack>

                    <HStack alignItems="center" space={2}>
                      <Ionicons name="time-outline" size={16} color="#4B5563" />
                      <Text fontSize="sm" color="gray.600">
                        {event.startsAt} - {event.endsAt}
                      </Text>
                    </HStack>

                    <HStack alignItems="center" space={2}>
                      <Ionicons name="location-outline" size={16} color="#4B5563" />
                      <Text fontSize="sm" color="gray.600">
                        {event.location}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}

          {/* No Events Message */}
          {!selectedDate && upcomingEvents.length === 0 && !loadingEvents && (
            <Box bg="white" p={6} borderRadius="lg" shadow={1} alignItems="center">
              <Text fontSize="lg" color="gray.500" textAlign="center">
                📭 No upcoming events
              </Text>
              <Text fontSize="sm" color="gray.400" mt={2} textAlign="center">
                Check back later for new events
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </ScrollView>
  );
}
