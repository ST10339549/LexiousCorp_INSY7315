
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
  AlertDialog,
  Button,
} from "native-base";
import { BackHandler } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchAllUsers, updateUserRole } from "../services/users";
import { User, Role } from "../types/user";

type ManageUsersScreenProps = {
  currentUserId: string;
  onBack?: () => void;
};

export default function ManageUsersScreen({
  currentUserId,
  onBack,
}: ManageUsersScreenProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const cancelRef = React.useRef(null);
  const toast = useToast();

  /**
   * Fetch all users on component mount
   */
  useEffect(() => {
    loadUsers();
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
   * Load users from Firestore
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.show({
        title: "Failed to load users",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle role selection change
   */
  const handleRoleChange = (user: User, newRole: Role) => {
    if (user.uid === currentUserId) {
      toast.show({
        title: "Cannot change your own role",
        description: "You cannot modify your own role for security reasons",
        placement: "top",
        bg: "orange.500",
        duration: 3000,
      });
      return;
    }

    if (user.role === newRole) {
      return; // No change
    }

    // Show confirmation dialog
    setSelectedUser(user);
    setSelectedRole(newRole);
    setConfirmDialogOpen(true);
  };

  /**
   * Confirm and update user role
   */
  const confirmRoleUpdate = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      setConfirmDialogOpen(false);
      setUpdatingUserId(selectedUser.uid);

      await updateUserRole(selectedUser.uid, selectedRole);

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.uid === selectedUser.uid ? { ...u, role: selectedRole } : u
        )
      );

      toast.show({
        title: "✅ Role Updated",
        description: `${selectedUser.name} is now a ${selectedRole}`,
        placement: "top",
        bg: "green.500",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.show({
        title: "Failed to update role",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        bg: "red.500",
      });
    } finally {
      setUpdatingUserId(null);
      setSelectedUser(null);
      setSelectedRole(null);
    }
  };

  /**
   * Get badge color for role
   */
  const getRoleBadgeColor = (role: Role): string => {
    switch (role) {
      case "admin":
        return "red.500";
      case "staff":
        return "blue.500";
      case "parent":
        return "green.500";
      default:
        return "gray.500";
    }
  };

  /**
   * Render individual user card
   */
  const renderUserCard = (user: User) => {
    const isCurrentUser = user.uid === currentUserId;
    const isUpdating = updatingUserId === user.uid;

    return (
      <Box key={user.uid} mb={3}>
        <Box bg="coolGray.800" rounded="xl" p={4} shadow={2}>
          <VStack space={3}>
            {/* User Info Header */}
            <HStack justifyContent="space-between" alignItems="center">
              <VStack flex={1} mr={3}>
                <HStack alignItems="center" space={2}>
                  <Heading color="white" size="md">
                    {user.name}
                  </Heading>
                  {isCurrentUser && (
                    <Badge bg="purple.500" rounded="md" px={2}>
                      <Text color="white" fontSize="xs" fontWeight="600">
                        YOU
                      </Text>
                    </Badge>
                  )}
                </HStack>
                <Text color="coolGray.400" fontSize="sm">
                  {user.email}
                </Text>
              </VStack>

              {/* Current Role Badge */}
              <Badge
                bg={getRoleBadgeColor(user.role)}
                rounded="full"
                px={3}
                py={1}
              >
                <Text color="white" fontSize="xs" fontWeight="600">
                  {user.role.toUpperCase()}
                </Text>
              </Badge>
            </HStack>

            {/* Role Selector */}
            <HStack alignItems="center" space={3}>
              <Text color="coolGray.300" fontSize="sm" fontWeight="500">
                Change Role:
              </Text>
              <Box flex={1}>
                <Select
                  selectedValue={user.role}
                  minWidth="100%"
                  placeholder="Select role"
                  onValueChange={(value) =>
                    handleRoleChange(user, value as Role)
                  }
                  bg="coolGray.700"
                  color="white"
                  borderColor="coolGray.600"
                  rounded="lg"
                  isDisabled={isCurrentUser || isUpdating}
                  _selectedItem={{
                    bg: "brand.500",
                    endIcon: <CheckIcon size="5" color="white" />,
                  }}
                  _actionSheetContent={{
                    bg: "coolGray.800",
                  }}
                >
                  <Select.Item label="Admin" value="admin" />
                  <Select.Item label="Staff" value="staff" />
                  <Select.Item label="Parent" value="parent" />
                </Select>
              </Box>

              {isUpdating && <Spinner size="sm" color="brand.500" />}
            </HStack>

            {/* Warning for current user */}
            {isCurrentUser && (
              <Box bg="orange.900" p={2} rounded="md" borderWidth={1} borderColor="orange.600">
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="info" size="sm" color="orange.400" />
                  <Text color="orange.200" fontSize="xs">
                    You cannot change your own role
                  </Text>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>
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
                  <Icon
                    as={MaterialIcons}
                    name="arrow-back"
                    size="lg"
                    color="white"
                  />
                }
                onPress={onBack}
                variant="ghost"
                _pressed={{ bg: "coolGray.700" }}
              />
            )}
            <Heading color="white" size="xl" flex={1}>
              Manage Users
            </Heading>
          </HStack>
          <HStack justifyContent="space-between" alignItems="center">
            <Text color="coolGray.400" fontSize="md">
              Assign roles to users
            </Text>
            <Badge bg="brand.500" px={3} py={1} rounded="full">
              <Text color="white" fontSize="xs" fontWeight="600">
                {users.length} {users.length === 1 ? "User" : "Users"}
              </Text>
            </Badge>
          </HStack>
        </VStack>
      </Box>

      {/* Users List */}
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="lg" color="brand.500" />
          <Text color="coolGray.400" mt={4} fontSize="md">
            Loading users...
          </Text>
        </Box>
      ) : (
        <ScrollView flex={1} px={6} py={4}>
          {users.length === 0 ? (
            <Box mt={10} alignItems="center">
              <Icon
                as={MaterialIcons}
                name="people"
                size="4xl"
                color="coolGray.600"
              />
              <Text color="coolGray.500" fontSize="lg" mt={4} textAlign="center">
                No users found
              </Text>
            </Box>
          ) : (
            <VStack space={1}>
              {users.map((user) => renderUserCard(user))}
            </VStack>
          )}
        </ScrollView>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <AlertDialog.Content bg="coolGray.800">
          <AlertDialog.CloseButton />
          <AlertDialog.Header bg="coolGray.800" borderBottomWidth={0}>
            <Text color="white" fontSize="lg" fontWeight="600">
              Confirm Role Change
            </Text>
          </AlertDialog.Header>
          <AlertDialog.Body bg="coolGray.800">
            <Text color="coolGray.300">
              Are you sure you want to change{" "}
              <Text color="white" fontWeight="600">
                {selectedUser?.name}
              </Text>
              's role from{" "}
              <Text color={getRoleBadgeColor(selectedUser?.role || "parent")} fontWeight="600">
                {selectedUser?.role}
              </Text>{" "}
              to{" "}
              <Text color={getRoleBadgeColor(selectedRole || "parent")} fontWeight="600">
                {selectedRole}
              </Text>
              ?
            </Text>
          </AlertDialog.Body>
          <AlertDialog.Footer bg="coolGray.800" borderTopWidth={0}>
            <Button.Group space={2}>
              <Button
                variant="outline"
                colorScheme="coolGray"
                onPress={() => setConfirmDialogOpen(false)}
                ref={cancelRef}
              >
                Cancel
              </Button>
              <Button bg="brand.500" onPress={confirmRoleUpdate}>
                Confirm
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
}
