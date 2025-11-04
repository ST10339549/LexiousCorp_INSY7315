import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  Heading,
  Spinner,
  Divider,
  Pressable,
  ScrollView,
  IconButton,
  Icon,
} from "native-base";
import { BackHandler } from "react-native";
import { collection, getDocs, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/shared";

// Type definition for a child record
type Child = {
  id: string;
  name: string;
  parentName?: string;
  age?: number;
};

// Type definition for attendance status
type AttendanceStatus = "present" | "absent";

// Type definition for attendance record with local state
type AttendanceRecord = {
  childId: string;
  childName: string;
  status: AttendanceStatus;
  timestamp: Date;
};

// Props for the AttendanceScreen component
type AttendanceScreenProps = {
  onBack?: () => void;
  userId?: string;
};

export default function AttendanceScreen({ onBack, userId }: AttendanceScreenProps) {
  // State for children list fetched from Firestore
  const [children, setChildren] = useState<Child[]>([]);
  
  // State for attendance records (local UI state)
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(
    new Map()
  );
  
  // Loading state while fetching children
  const [loading, setLoading] = useState<boolean>(true);
  
  // Submitting state when saving attendance
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * Fetch children from Firestore on component mount
   */
  useEffect(() => {
    fetchChildren();
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
   * Fetches all children from the 'children' collection in Firestore
   */
  const fetchChildren = async () => {
    try {
      setLoading(true);
      const childrenRef = collection(db, "children");
      const snapshot = await getDocs(childrenRef);

      const childrenList: Child[] = [];
      const initialAttendance = new Map<string, AttendanceRecord>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const child: Child = {
          id: doc.id,
          name: data.name || "Unknown",
          parentName: data.parentName,
          age: data.age,
        };
        childrenList.push(child);

        // Initialize attendance record with default "absent" status
        initialAttendance.set(child.id, {
          childId: child.id,
          childName: child.name,
          status: "absent",
          timestamp: new Date(),
        });
      });

      setChildren(childrenList);
      setAttendanceRecords(initialAttendance);
    } catch (error) {
      console.error("Error fetching children:", error);
      alert("Failed to load children list");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marks attendance for a specific child
   * Updates both Firestore and local state
   * @param childId - The ID of the child
   * @param status - The attendance status (present/absent)
   */
  const markAttendance = async (childId: string, status: AttendanceStatus) => {
    try {
      const currentRecord = attendanceRecords.get(childId);
      if (!currentRecord) return;

      // Update local state immediately for responsive UI
      const updatedRecord: AttendanceRecord = {
        ...currentRecord,
        status,
        timestamp: new Date(),
      };

      const newRecords = new Map(attendanceRecords);
      newRecords.set(childId, updatedRecord);
      setAttendanceRecords(newRecords);

      // Save to Firestore
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const attendanceRef = doc(db, "attendance", `${childId}_${today}`);

      await setDoc(
        attendanceRef,
        {
          childId,
          childName: currentRecord.childName,
          status,
          timestamp: Timestamp.fromDate(updatedRecord.timestamp),
          date: today,
          markedBy: userId || "unknown",
        },
        { merge: true }
      );

      console.log(`Attendance marked for ${currentRecord.childName}: ${status}`);
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance");
    }
  };

  /**
   * Handles the Submit Attendance button press
   * In production, this would finalize and lock the attendance
   */
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      
      // Count present and absent children
      let presentCount = 0;
      let absentCount = 0;
      
      attendanceRecords.forEach((record) => {
        if (record.status === "present") presentCount++;
        else absentCount++;
      });

      // Log summary for now (can be replaced with actual submission logic)
      console.log("=== ATTENDANCE SUMMARY ===");
      console.log(`Total Children: ${attendanceRecords.size}`);
      console.log(`Present: ${presentCount}`);
      console.log(`Absent: ${absentCount}`);
      console.log("=========================");

      alert(
        `Attendance Submitted!\n\nPresent: ${presentCount}\nAbsent: ${absentCount}\nTotal: ${attendanceRecords.size}`
      );
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Renders the loading spinner
   */
  if (loading) {
    return (
      <Box flex={1} bg="coolGray.900" justifyContent="center" alignItems="center">
        <Spinner size="lg" color="brand.500" />
        <Text color="coolGray.400" mt={4} fontSize="md">
          Loading children...
        </Text>
      </Box>
    );
  }

  /**
   * Renders individual attendance row for a child
   */
  const renderAttendanceRow = (child: Child) => {
    const record = attendanceRecords.get(child.id);
    const isPresent = record?.status === "present";

    return (
      <Box key={child.id} mb={2}>
        {/* Attendance Card */}
        <Pressable>
          <AppCard>
            <HStack justifyContent="space-between" alignItems="center">
              {/* Left: Child Information */}
              <VStack flex={1} mr={4}>
                <Text color="gray.800" fontSize="lg" fontWeight="600">
                  {child.name}
                </Text>
                {child.parentName && (
                  <Text color="gray.600" fontSize="sm">
                    Parent: {child.parentName}
                  </Text>
                )}
                {child.age && (
                  <Text color="gray.500" fontSize="xs">
                    Age: {child.age} years
                  </Text>
                )}
              </VStack>

              {/* Right: Status Toggle */}
              <VStack alignItems="flex-end" space={1}>
                <HStack space={3} alignItems="center">
                  <Text
                    color={isPresent ? "gray.400" : "success.600"}
                    fontSize="sm"
                    fontWeight="500"
                  >
                    Absent
                  </Text>
                  <Switch
                    size="md"
                    isChecked={isPresent}
                    onToggle={() => {
                      const newStatus = isPresent ? "absent" : "present";
                      markAttendance(child.id, newStatus);
                    }}
                    offTrackColor="gray.300"
                    onTrackColor="success.500"
                    onThumbColor="white"
                    offThumbColor="white"
                  />
                  <Text
                    color={isPresent ? "success.600" : "gray.400"}
                    fontSize="sm"
                    fontWeight="500"
                  >
                    Present
                  </Text>
                </HStack>
                
                {/* Timestamp */}
                {record && (
                  <Text color="gray.500" fontSize="xs">
                    {record.timestamp.toLocaleTimeString()}
                  </Text>
                )}
              </VStack>
            </HStack>
          </AppCard>
        </Pressable>
      </Box>
    );
  };

  return (
    <Box flex={1} bg="#F7F9FC" safeArea>
      {/* Header Section */}
      <Box bg="white" px={6} py={4} shadow={2} borderBottomWidth={1} borderBottomColor="gray.200">
        <VStack space={2}>
          <HStack alignItems="center" space={3}>
            {/* Back Button */}
            {onBack && (
              <IconButton
                icon={<Icon as={Ionicons} name="arrow-back" size="lg" color="gray.800" />}
                onPress={onBack}
                variant="ghost"
                _pressed={{ bg: "gray.100" }}
              />
            )}
            <Heading color="gray.800" size="xl" flex={1}>
              Daily Attendance
            </Heading>
          </HStack>
          <HStack justifyContent="space-between" alignItems="center">
            <Text color="gray.600" fontSize="md">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <HStack space={2}>
              <Box bg="success.500" px={3} py={1} rounded="full">
                <Text color="white" fontSize="xs" fontWeight="600">
                  {Array.from(attendanceRecords.values()).filter((r) => r.status === "present")
                    .length}{" "}
                  Present
                </Text>
              </Box>
              <Box bg="error.500" px={3} py={1} rounded="full">
                <Text color="white" fontSize="xs" fontWeight="600">
                  {Array.from(attendanceRecords.values()).filter((r) => r.status === "absent")
                    .length}{" "}
                  Absent
                </Text>
              </Box>
            </HStack>
          </HStack>
        </VStack>
      </Box>

      {/* Attendance List */}
      <ScrollView flex={1} px={6} py={4}>
        {children.length === 0 ? (
          <Box mt={10} alignItems="center">
            <Icon as={Ionicons} name="people-outline" size={16} color="gray.300" mb={3} />
            <Text color="gray.500" fontSize="lg">
              No children registered yet
            </Text>
          </Box>
        ) : (
          <VStack space={1}>
            {children.map((child) => renderAttendanceRow(child))}
          </VStack>
        )}
      </ScrollView>

      {/* Floating Submit Button */}
      {children.length > 0 && (
        <Box position="absolute" bottom={6} left={6} right={6}>
          <Button
            size="lg"
            bg="primary.400"
            rounded="full"
            shadow={5}
            onPress={handleSubmitAttendance}
            isLoading={submitting}
            isLoadingText="Submitting..."
            _pressed={{ bg: "primary.500" }}
            _text={{
              fontSize: "lg",
              fontWeight: "700",
            }}
          >
            Submit Attendance
          </Button>
        </Box>
      )}
    </Box>
  );
}
