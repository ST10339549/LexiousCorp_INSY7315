import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  Input,
  Select,
  CheckIcon,
  Heading,
  useToast,
  ScrollView,
  Spinner,
  IconButton,
  Icon,
  WarningOutlineIcon,
  Alert,
} from "native-base";
import { KeyboardAvoidingView, Platform } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { addChildUnique, checkChildExists } from "../services/children";
import { MaterialIcons } from "@expo/vector-icons";
import { Role } from "../types/user";

type Parent = {
  uid: string;
  name: string;
  email: string;
};

type AddChildScreenProps = {
  userRole: Role;
  userId: string;
  onBack?: () => void;
  onSuccess?: () => void;
};

export default function AddChildScreen({
  userRole,
  userId,
  onBack,
  onSuccess,
}: AddChildScreenProps) {
  // Form state
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // Parents list (for admin only)
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Duplicate detection
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    childName: "",
    dateOfBirth: "",
    parentId: "",
    duplicate: "",
  });

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  /**
   * Fetch parents list if user is admin
   */
  useEffect(() => {
    if (userRole === "admin") {
      fetchParents();
    } else {
      // If parent or staff, auto-select their own ID
      setSelectedParentId(userId);
    }
  }, [userRole, userId]);

  /**
   * Check for duplicate child when name and DOB are entered
   */
  useEffect(() => {
    const checkDuplicate = async () => {
      // Only check if we have all required fields
      if (!childName.trim() || !dateOfBirth.trim() || !validateDate(dateOfBirth)) {
        setIsDuplicate(false);
        setErrors((prev) => ({ ...prev, duplicate: "" }));
        return;
      }

      const parentId = userRole === "parent" ? userId : selectedParentId;
      if (!parentId) return;

      try {
        setCheckingDuplicate(true);
        const exists = await checkChildExists(parentId, childName, dateOfBirth);
        setIsDuplicate(exists);
        
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            duplicate: "A child with this name and date of birth already exists for this parent",
          }));
        } else {
          setErrors((prev) => ({ ...prev, duplicate: "" }));
        }
      } catch (error) {
        console.error("Error checking duplicate:", error);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    const debounceTimer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(debounceTimer);
  }, [childName, dateOfBirth, selectedParentId, userId, userRole]);

  /**
   * Fetch all parents from Firestore
   */
  const fetchParents = async () => {
    try {
      setLoadingParents(true);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "parent"));
      const snapshot = await getDocs(q);

      const parentsList: Parent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        parentsList.push({
          uid: doc.id,
          name: data.name || "Unknown",
          email: data.email || "",
        });
      });

      setParents(parentsList);
      console.log(`Fetched ${parentsList.length} parents`);
    } catch (error) {
      console.error("Error fetching parents:", error);
      toast.show({
        title: "Error loading parents",
        placement: "top",
        duration: 3000,
      });
    } finally {
      setLoadingParents(false);
    }
  };

  /**
   * Validate date format YYYY-MM-DD
   */
  const validateDate = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  /**
   * Parse allergies from comma-separated string
   */
  const parseAllergies = (input: string): string[] => {
    if (!input.trim()) return [];
    return input
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors = {
      childName: "",
      dateOfBirth: "",
      parentId: "",
      duplicate: "",
    };

    let isValid = true;

    // Validate child name
    if (!childName.trim()) {
      newErrors.childName = "Child name is required";
      isValid = false;
    }

    // Validate date of birth
    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
      isValid = false;
    } else if (!validateDate(dateOfBirth)) {
      newErrors.dateOfBirth = "Invalid date format (use YYYY-MM-DD)";
      isValid = false;
    }

    // Validate parent selection (admin only)
    if (userRole === "admin" && !selectedParentId) {
      newErrors.parentId = "Please select a parent";
      isValid = false;
    }

    // Check for duplicates
    if (isDuplicate) {
      newErrors.duplicate = "A child with this name and date of birth already exists for this parent";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const parentId = userRole === "parent" ? userId : selectedParentId;
      const allergies = parseAllergies(allergiesInput);

      console.log(`[AddChildScreen] Creating child for parentId: ${parentId}, name: ${childName}, DOB: ${dateOfBirth}`);

      const childId = await addChildUnique({
        parentId,
        name: childName,
        dateOfBirth,
        allergies,
      });

      console.log(`[AddChildScreen] Child created successfully with ID: ${childId}`);

      toast.show({
        title: "Child created successfully! 🎉",
        placement: "top",
        duration: 3000,
        bg: "green.500",
      });

      // Clear form
      setChildName("");
      setDateOfBirth("");
      setAllergiesInput("");
      if (userRole === "admin") {
        setSelectedParentId("");
      }
      setErrors({ childName: "", dateOfBirth: "", parentId: "", duplicate: "" });
      setIsDuplicate(false);

      // Navigate back or trigger success callback
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (error) {
      console.error("Error creating child:", error);
      toast.show({
        title: "Failed to create child",
        description: error instanceof Error ? error.message : "Unknown error",
        placement: "top",
        duration: 4000,
        bg: "red.500",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Box flex={1} bg="coolGray.900" safeArea>
        {/* Header */}
        <Box bg="coolGray.800" px={6} py={4} shadow={3}>
          <HStack alignItems="center" space={3}>
            {onBack && (
              <IconButton
                icon={<Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />}
                onPress={onBack}
                variant="ghost"
                _pressed={{ bg: "coolGray.700" }}
              />
            )}
            <Heading color="white" size="xl" flex={1}>
              Add Child
            </Heading>
          </HStack>
        </Box>

        {/* Form Content */}
        <ScrollView flex={1} px={6} py={6}>
          <VStack space={6}>
            {/* Parent Selector (Admin Only) */}
            {userRole === "admin" && (
              <FormControl isRequired isInvalid={!!errors.parentId}>
                <FormControl.Label>
                  <Text color="white" fontSize="md" fontWeight="500">
                    Select Parent
                  </Text>
                </FormControl.Label>
                {loadingParents ? (
                  <HStack space={2} alignItems="center" py={3}>
                    <Spinner size="sm" color="brand.500" />
                    <Text color="coolGray.400">Loading parents...</Text>
                  </HStack>
                ) : (
                  <Select
                    selectedValue={selectedParentId}
                    minWidth="100%"
                    placeholder="Choose parent"
                    onValueChange={(value) => {
                      setSelectedParentId(value);
                      setErrors({ ...errors, parentId: "" });
                    }}
                    bg="coolGray.800"
                    color="white"
                    borderColor="coolGray.600"
                    rounded="xl"
                    py={3}
                    _selectedItem={{
                      bg: "brand.500",
                      endIcon: <CheckIcon size="5" color="white" />,
                    }}
                    _actionSheetContent={{
                      bg: "coolGray.800",
                    }}
                  >
                    {parents.map((parent) => (
                      <Select.Item
                        key={parent.uid}
                        label={`${parent.name} (${parent.email})`}
                        value={parent.uid}
                      />
                    ))}
                  </Select>
                )}
                {errors.parentId && (
                  <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                    {errors.parentId}
                  </FormControl.ErrorMessage>
                )}
              </FormControl>
            )}

            {/* Child Name */}
            <FormControl isRequired isInvalid={!!errors.childName}>
              <FormControl.Label>
                <Text color="white" fontSize="md" fontWeight="500">
                  Child Name
                </Text>
              </FormControl.Label>
              <Input
                value={childName}
                onChangeText={(text) => {
                  setChildName(text);
                  setErrors({ ...errors, childName: "" });
                }}
                placeholder="Enter child's full name"
                bg="coolGray.800"
                color="white"
                borderColor="coolGray.600"
                rounded="xl"
                py={3}
                fontSize="md"
                _focus={{
                  bg: "coolGray.800",
                  borderColor: "brand.500",
                }}
              />
              {errors.childName && (
                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                  {errors.childName}
                </FormControl.ErrorMessage>
              )}
            </FormControl>

            {/* Date of Birth */}
            <FormControl isRequired isInvalid={!!errors.dateOfBirth}>
              <FormControl.Label>
                <Text color="white" fontSize="md" fontWeight="500">
                  Date of Birth
                </Text>
              </FormControl.Label>
              <Input
                value={dateOfBirth}
                onChangeText={(text) => {
                  setDateOfBirth(text);
                  setErrors({ ...errors, dateOfBirth: "" });
                }}
                placeholder="YYYY-MM-DD (e.g., 2020-05-15)"
                bg="coolGray.800"
                color="white"
                borderColor="coolGray.600"
                rounded="xl"
                py={3}
                fontSize="md"
                _focus={{
                  bg: "coolGray.800",
                  borderColor: "brand.500",
                }}
              />
              {errors.dateOfBirth && (
                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                  {errors.dateOfBirth}
                </FormControl.ErrorMessage>
              )}
            </FormControl>

            {/* Allergies */}
            <FormControl>
              <FormControl.Label>
                <Text color="white" fontSize="md" fontWeight="500">
                  Allergies (Optional)
                </Text>
              </FormControl.Label>
              <Input
                value={allergiesInput}
                onChangeText={setAllergiesInput}
                placeholder="e.g., Peanuts, Dairy, Eggs (comma-separated)"
                bg="coolGray.800"
                color="white"
                borderColor="coolGray.600"
                rounded="xl"
                py={3}
                fontSize="md"
                _focus={{
                  bg: "coolGray.800",
                  borderColor: "brand.500",
                }}
              />
              <FormControl.HelperText>
                <Text color="coolGray.500" fontSize="sm">
                  Separate multiple allergies with commas
                </Text>
              </FormControl.HelperText>

              {/* Preview allergies as chips */}
              {allergiesInput.trim() && (
                <HStack flexWrap="wrap" mt={2} space={2}>
                  {parseAllergies(allergiesInput).map((allergy, index) => (
                    <Box
                      key={index}
                      bg="red.500"
                      px={3}
                      py={1}
                      rounded="full"
                      mb={2}
                    >
                      <Text color="white" fontSize="xs" fontWeight="500">
                        {allergy}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              )}
            </FormControl>

            {/* Duplicate Warning Alert */}
            {(isDuplicate || checkingDuplicate) && (
              <Alert status="warning" bg="orange.600" rounded="xl">
                <HStack space={2} alignItems="center">
                  {checkingDuplicate ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <Alert.Icon color="white" />
                  )}
                  <VStack flex={1}>
                    <Text color="white" fontWeight="600" fontSize="sm">
                      {checkingDuplicate
                        ? "Checking for duplicates..."
                        : "Duplicate Child Detected"}
                    </Text>
                    {isDuplicate && !checkingDuplicate && (
                      <Text color="white" fontSize="xs">
                        A child with this name and date of birth already exists for this parent
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              size="lg"
              bg="brand.500"
              rounded="xl"
              mt={4}
              onPress={handleSubmit}
              isLoading={submitting}
              isLoadingText="Creating child..."
              _pressed={{ bg: "brand.600" }}
              isDisabled={submitting || isDuplicate || checkingDuplicate}
            >
              <Text color="white" fontSize="md" fontWeight="600">
                Add Child
              </Text>
            </Button>
          </VStack>
        </ScrollView>
      </Box>
    </KeyboardAvoidingView>
  );
}
