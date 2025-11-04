
import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  ScrollView,
  Spinner,
  IconButton,
  Icon,
  Badge,
  Divider,
} from "native-base";
import { BackHandler } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getStaffAssignments, Assignment } from "../services/assignments";
import { Child } from "../services/children";
import { User } from "../services/users";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

type StaffMyClassScreenProps = {
  staffId: string;
  staffName?: string;
  onBack?: () => void;
};

export default function StaffMyClassScreen({
  staffId,
  staffName,
  onBack,
}: StaffMyClassScreenProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [childrenData, setChildrenData] = useState<Map<string, Child>>(new Map());
  const [parentsData, setParentsData] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);

  /**
   * Load assigned children on mount
   */
  useEffect(() => {
    loadAssignments();
  }, [staffId]);

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
   * Load assigned children
   */
  const loadAssignments = async () => {
    try {
      setLoading(true);
      const staffAssignments = await getStaffAssignments(staffId);
      setAssignments(staffAssignments);

      // Fetch full child data for each assignment
      const childDataMap = new Map<string, Child>();
      const parentDataMap = new Map<string, User>();
      const parentIdsToFetch = new Set<string>();

      for (const assignment of staffAssignments) {
        try {
          const childRef = doc(db, "children", assignment.childId);
          const childDoc = await getDoc(childRef);
          if (childDoc.exists()) {
            const childData = {
              id: childDoc.id,
              ...childDoc.data(),
            } as Child;
            childDataMap.set(assignment.childId, childData);
            
            // Collect parent IDs to fetch
            if (childData.parentId) {
              parentIdsToFetch.add(childData.parentId);
            }
          }
        } catch (error) {
          console.error(`Error fetching child ${assignment.childId}:`, error);
        }
      }

      // Fetch parent data for all unique parent IDs
      for (const parentId of parentIdsToFetch) {
        try {
          const parentRef = doc(db, "users", parentId);
          const parentDoc = await getDoc(parentRef);
          if (parentDoc.exists()) {
            parentDataMap.set(parentId, parentDoc.data() as User);
          }
        } catch (error) {
          console.error(`Error fetching parent ${parentId}:`, error);
        }
      }

      setChildrenData(childDataMap);
      setParentsData(parentDataMap);

      console.log(`Loaded ${staffAssignments.length} assigned children for staff ${staffId}`);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render child card
   */
  const renderChildCard = (assignment: Assignment) => {
    const child = childrenData.get(assignment.childId);
    const parent = child?.parentId ? parentsData.get(child.parentId) : null;

    return (
      <Box key={assignment.id} mb={3}>
        <Box bg="white" rounded="xl" p={4} shadow={2}>
          <VStack space={2}>
            {/* Child Name */}
            <HStack justifyContent="space-between" alignItems="center">
              <Heading color="gray.800" size="md">
                {assignment.childName}
              </Heading>
              <Icon as={Ionicons} name="checkmark-circle" size="md" color="green.400" />
            </HStack>

            {/* Parent Name */}
            {parent && (
              <HStack space={2} alignItems="center">
                <Icon as={Ionicons} name="person" size="sm" color="purple.400" />
                <Text color="purple.400" fontSize="sm" fontWeight="500">
                  Parent: {parent.name}
                </Text>
              </HStack>
            )}

            {/* Date of Birth */}
            {child?.dateOfBirth && (
              <HStack space={2} alignItems="center">
                <Icon as={Ionicons} name="calendar-outline" size="sm" color="gray.600" />
                <Text color="gray.600" fontSize="sm">
                  DOB: {new Date(child.dateOfBirth).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </HStack>
            )}

            {/* Allergies */}
            {child?.allergies && child.allergies.length > 0 && (
              <HStack space={2} alignItems="center" flexWrap="wrap">
                <Icon as={Ionicons} name="warning" size="sm" color="red.400" />
                <Text color="red.400" fontSize="sm" fontWeight="600">
                  Allergies:
                </Text>
                <HStack space={1} flexWrap="wrap">
                  {child.allergies.map((allergy, index) => (
                    <Box key={index} bg="red.500" px={2} py={1} rounded="full" mr={1} mb={1}>
                      <Text color="gray.800" fontSize="xs" fontWeight="500">
                        {allergy}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </HStack>
            )}

            {/* Assigned Date */}
            <HStack space={2} alignItems="center">
              <Icon as={Ionicons} name="time-outline" size="sm" color="gray.600" />
              <Text color="gray.600" fontSize="sm">
                Assigned:{" "}
                {assignment.assignedAt
                  ? new Date(assignment.assignedAt.toDate()).toLocaleDateString()
                  : "Recently"}
              </Text>
            </HStack>
          </VStack>
        </Box>
        <Divider bg="gray.100" my={2} />
      </Box>
    );
  };

  return (
    <Box flex={1} bg="#F7F9FC" safeArea>
      {/* Header */}
      <Box bg="white" px={6} py={4} shadow={3}>
        <VStack space={2}>
          <HStack alignItems="center" space={3}>
            {onBack && (
              <IconButton
                icon={
                  <Icon as={Ionicons} name="arrow-back" size="lg" color="gray.800" />
                }
                onPress={onBack}
                variant="ghost"
                _pressed={{ bg: "coolGray.700" }}
              />
            )}
            <Heading color="gray.800" size="xl" flex={1}>
              My Class
            </Heading>
          </HStack>
          <HStack justifyContent="space-between" alignItems="center">
            <Text color="gray.600" fontSize="md">
              Teacher: {staffName || "Staff"}
            </Text>
            <Badge bg="green.500" px={3} py={1} rounded="full">
              <Text color="gray.800" fontSize="xs" fontWeight="600">
                {assignments.length} {assignments.length === 1 ? "Child" : "Children"}
              </Text>
            </Badge>
          </HStack>
        </VStack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="lg" color="primary.400" />
          <Text color="gray.600" mt={4} fontSize="md">
            Loading your class...
          </Text>
        </Box>
      ) : (
        <ScrollView flex={1} px={6} py={4}>
          {assignments.length === 0 ? (
            <Box mt={10} alignItems="center">
              <Icon
                as={Ionicons}
                name="child-care"
                size="4xl"
                color="coolGray.600"
              />
              <Text color="gray.500" fontSize="lg" mt={4} textAlign="center">
                No children assigned yet
              </Text>
              <Text color="coolGray.600" fontSize="sm" mt={2} textAlign="center">
                Your administrator will assign children to you
              </Text>
            </Box>
          ) : (
            <VStack space={1}>
              {/* Summary Info */}
              <Box bg="blue.900" p={4} rounded="xl" borderWidth={1} borderColor="blue.600" mb={4}>
                <VStack space={2}>
                  <HStack space={2} alignItems="center">
                    <Icon as={Ionicons} name="information-circle-outline" size="sm" color="blue.400" />
                    <Text color="blue.200" fontSize="md" fontWeight="600">
                      Class Summary
                    </Text>
                  </HStack>
                  <Text color="blue.300" fontSize="sm">
                    You have {assignments.length} {assignments.length === 1 ? "child" : "children"} in your class
                  </Text>
                </VStack>
              </Box>

              {/* Children List */}
              {assignments.map((assignment) => renderChildCard(assignment))}
            </VStack>
          )}
        </ScrollView>
      )}
    </Box>
  );
}
