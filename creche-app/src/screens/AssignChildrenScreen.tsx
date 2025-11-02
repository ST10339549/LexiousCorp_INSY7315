
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
  Select,
  CheckIcon,
  useToast,
  Button,
  Divider,
} from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchAllChildren, Child } from "../services/children";
import { fetchAllUsers, User } from "../services/users";
import {
  assignChildToStaff,
  removeChildAssignment,
  getAllAssignments,
  Assignment,
} from "../services/assignments";

type AssignChildrenScreenProps = {
  currentAdminId: string;
  onBack?: () => void;
};

export default function AssignChildrenScreen({
  currentAdminId,
  onBack,
}: AssignChildrenScreenProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const toast = useToast();

  /**
   * Load all data on component mount
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Load children, staff, and assignments
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [allChildren, allUsers, allAssignments] = await Promise.all([
        fetchAllChildren(),
        fetchAllUsers(),
        getAllAssignments(),
      ]);

      // Filter only staff members
      const staff = allUsers.filter((user) => user.role === "staff");

      setChildren(allChildren);
      setStaffMembers(staff);

      // Build assignments map (childId -> staffId)
      const assignmentMap = new Map<string, string>();
      allAssignments.forEach((assignment) => {
        assignmentMap.set(assignment.childId, assignment.staffId);
      });
      setAssignments(assignmentMap);

      console.log(`Loaded ${allChildren.length} children, ${staff.length} staff, ${allAssignments.length} assignments`);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.show({
        title: "Failed to load data",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle assignment change
   */
  const handleAssignmentChange = async (child: Child, newStaffId: string) => {
    const currentStaffId = assignments.get(child.id);

    // If unassigning (empty value)
    if (!newStaffId) {
      if (currentStaffId) {
        await handleUnassign(child, currentStaffId);
      }
      return;
    }

    // If already assigned to this staff
    if (currentStaffId === newStaffId) {
      return;
    }

    try {
      setUpdating(child.id);

      const staff = staffMembers.find((s) => s.uid === newStaffId);
      if (!staff) {
        throw new Error("Staff member not found");
      }

      // Remove old assignment if exists
      if (currentStaffId) {
        await removeChildAssignment(currentStaffId, child.id);
      }

      // Create new assignment
      await assignChildToStaff(
        child.id,
        child.name,
        newStaffId,
        staff.name,
        currentAdminId
      );

      // Update local state
      setAssignments((prev) => {
        const newMap = new Map(prev);
        newMap.set(child.id, newStaffId);
        return newMap;
      });

      toast.show({
        title: "✅ Assignment Updated",
        description: `${child.name} is now assigned to ${staff.name}`,
        placement: "top",
        bg: "green.500",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.show({
        title: "Failed to update assignment",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setUpdating(null);
    }
  };

  /**
   * Handle unassigning a child
   */
  const handleUnassign = async (child: Child, staffId: string) => {
    try {
      setUpdating(child.id);

      await removeChildAssignment(staffId, child.id);

      // Update local state
      setAssignments((prev) => {
        const newMap = new Map(prev);
        newMap.delete(child.id);
        return newMap;
      });

      toast.show({
        title: "✅ Assignment Removed",
        description: `${child.name} is no longer assigned`,
        placement: "top",
        bg: "blue.500",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.show({
        title: "Failed to remove assignment",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setUpdating(null);
    }
  };

  /**
   * Get staff name by ID
   */
  const getStaffName = (staffId: string): string => {
    const staff = staffMembers.find((s) => s.uid === staffId);
    return staff ? staff.name : "Unknown";
  };

  /**
   * Get count of children per staff
   */
  const getStaffChildCount = (staffId: string): number => {
    return Array.from(assignments.values()).filter((id) => id === staffId).length;
  };

  /**
   * Render child assignment card
   */
  const renderChildCard = (child: Child) => {
    const assignedStaffId = assignments.get(child.id);
    const isUpdating = updating === child.id;

    return (
      <Box key={child.id} mb={3}>
        <Box bg="coolGray.800" rounded="xl" p={4} shadow={2}>
          <VStack space={3}>
            {/* Child Info */}
            <HStack justifyContent="space-between" alignItems="center">
              <VStack flex={1} mr={3}>
                <Heading color="white" size="md">
                  {child.name}
                </Heading>
                <Text color="coolGray.400" fontSize="sm">
                  DOB: {new Date(child.dateOfBirth).toLocaleDateString()}
                </Text>
                {child.allergies && child.allergies.length > 0 && (
                  <HStack space={1} flexWrap="wrap" mt={1}>
                    <Icon as={MaterialIcons} name="warning" size="xs" color="red.400" />
                    <Text color="red.400" fontSize="xs">
                      {child.allergies.join(", ")}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Assignment Status Badge */}
              {assignedStaffId ? (
                <Badge bg="green.500" rounded="full" px={3} py={1}>
                  <Text color="white" fontSize="xs" fontWeight="600">
                    ASSIGNED
                  </Text>
                </Badge>
              ) : (
                <Badge bg="orange.500" rounded="full" px={3} py={1}>
                  <Text color="white" fontSize="xs" fontWeight="600">
                    UNASSIGNED
                  </Text>
                </Badge>
              )}
            </HStack>

            {/* Staff Assignment Selector */}
            <VStack space={2}>
              <Text color="coolGray.300" fontSize="sm" fontWeight="500">
                Assigned Teacher:
              </Text>
              <HStack space={2} alignItems="center">
                <Box flex={1}>
                  <Select
                    selectedValue={assignedStaffId || ""}
                    minWidth="100%"
                    placeholder="Select a teacher..."
                    onValueChange={(value) => handleAssignmentChange(child, value)}
                    bg="coolGray.700"
                    color="white"
                    borderColor="coolGray.600"
                    rounded="lg"
                    isDisabled={isUpdating}
                    _selectedItem={{
                      bg: "brand.500",
                      endIcon: <CheckIcon size="5" color="white" />,
                    }}
                    _actionSheetContent={{
                      bg: "coolGray.800",
                    }}
                  >
                    <Select.Item label="Unassigned" value="" />
                    {staffMembers.map((staff) => (
                      <Select.Item
                        key={staff.uid}
                        label={`${staff.name} (${getStaffChildCount(staff.uid)} children)`}
                        value={staff.uid}
                      />
                    ))}
                  </Select>
                </Box>

                {isUpdating && <Spinner size="sm" color="brand.500" />}
              </HStack>

              {/* Show current assignment */}
              {assignedStaffId && (
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="person" size="sm" color="green.400" />
                  <Text color="green.400" fontSize="sm">
                    Currently assigned to: {getStaffName(assignedStaffId)}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Box>
        <Divider bg="coolGray.700" my={2} />
      </Box>
    );
  };

  return (
    <Box flex={1} bg="coolGray.900" safeArea>
      {/* Header */}
      <Box bg="coolGray.800" px={6} py={4} shadow={3}>
        <VStack space={2}>
          <HStack alignItems="center" space={3}>
            {onBack && (
              <IconButton
                icon={
                  <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
                }
                onPress={onBack}
                variant="ghost"
                _pressed={{ bg: "coolGray.700" }}
              />
            )}
            <Heading color="white" size="xl" flex={1}>
              Assign Children to Teachers
            </Heading>
          </HStack>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text color="coolGray.400" fontSize="sm">
                {children.length} Total Children
              </Text>
              <Text color="coolGray.400" fontSize="sm">
                {staffMembers.length} Available Teachers
              </Text>
            </VStack>
            <HStack space={2}>
              <Badge bg="green.500" px={3} py={1} rounded="full">
                <Text color="white" fontSize="xs" fontWeight="600">
                  {assignments.size} Assigned
                </Text>
              </Badge>
              <Badge bg="orange.500" px={3} py={1} rounded="full">
                <Text color="white" fontSize="xs" fontWeight="600">
                  {children.length - assignments.size} Unassigned
                </Text>
              </Badge>
            </HStack>
          </HStack>
        </VStack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="lg" color="brand.500" />
          <Text color="coolGray.400" mt={4} fontSize="md">
            Loading children and teachers...
          </Text>
        </Box>
      ) : (
        <ScrollView flex={1} px={6} py={4}>
          {/* No staff warning */}
          {staffMembers.length === 0 && (
            <Box bg="orange.900" p={4} rounded="xl" borderWidth={1} borderColor="orange.600" mb={4}>
              <HStack space={2} alignItems="center">
                <Icon as={MaterialIcons} name="warning" size="md" color="orange.400" />
                <VStack flex={1}>
                  <Text color="orange.200" fontSize="md" fontWeight="600">
                    No Teachers Available
                  </Text>
                  <Text color="orange.300" fontSize="sm">
                    Please create staff accounts first in "Manage Users"
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Children list */}
          {children.length === 0 ? (
            <Box mt={10} alignItems="center">
              <Icon as={MaterialIcons} name="child-care" size="4xl" color="coolGray.600" />
              <Text color="coolGray.500" fontSize="lg" mt={4} textAlign="center">
                No children registered yet
              </Text>
            </Box>
          ) : (
            <VStack space={1}>
              {children.map((child) => renderChildCard(child))}
            </VStack>
          )}
        </ScrollView>
      )}
    </Box>
  );
}
