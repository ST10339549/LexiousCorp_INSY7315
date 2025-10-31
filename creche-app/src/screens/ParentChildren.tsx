import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  ScrollView,
  Spinner,
  Fab,
  Icon,
  Divider,
  Badge,
} from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { listenChildrenByParent, Child } from "../services/children";

type ParentChildrenProps = {
  parentId: string;
  parentName?: string;
  onAddChild?: () => void;
  onBack?: () => void;
};

export default function ParentChildren({
  parentId,
  parentName,
  onAddChild,
  onBack,
}: ParentChildrenProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Subscribe to real-time updates for children
   */
  useEffect(() => {
    console.log(`[ParentChildren] Setting up listener for parentId: ${parentId}`);
    setLoading(true);
    
    const unsubscribe = listenChildrenByParent(parentId, (updatedChildren) => {
      console.log(`[ParentChildren] Received ${updatedChildren.length} children:`, updatedChildren.map(c => c.name));
      setChildren(updatedChildren);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log(`[ParentChildren] Cleaning up listener for parentId: ${parentId}`);
      unsubscribe();
    };
  }, [parentId]);

  /**
   * Calculate child's age from date of birth
   */
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  /**
   * Render individual child card
   */
  const renderChildCard = (child: Child) => {
    const age = calculateAge(child.dateOfBirth);
    const hasAllergies = child.allergies && child.allergies.length > 0;

    return (
      <Box key={child.id} mb={3}>
        <Box bg="coolGray.800" rounded="xl" p={4} shadow={2}>
          <VStack space={2}>
            {/* Child Name and Age */}
            <HStack justifyContent="space-between" alignItems="center">
              <Heading color="white" size="md">
                {child.name}
              </Heading>
              <Badge bg="brand.500" rounded="full" px={3} py={1}>
                <Text color="white" fontSize="xs" fontWeight="600">
                  {age} {age === 1 ? "year" : "years"}
                </Text>
              </Badge>
            </HStack>

            {/* Date of Birth */}
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="cake" size="sm" color="coolGray.400" />
              <Text color="coolGray.400" fontSize="sm">
                Born: {new Date(child.dateOfBirth).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </HStack>

            {/* Allergies */}
            {hasAllergies && (
              <VStack space={1} mt={2}>
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="warning" size="sm" color="red.400" />
                  <Text color="red.400" fontSize="sm" fontWeight="600">
                    Allergies:
                  </Text>
                </HStack>
                <HStack flexWrap="wrap" space={2} mt={1}>
                  {child.allergies.map((allergy, index) => (
                    <Box key={index} bg="red.500" px={3} py={1} rounded="full" mb={1}>
                      <Text color="white" fontSize="xs" fontWeight="500">
                        {allergy}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </VStack>
            )}
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
              <Icon
                as={MaterialIcons}
                name="arrow-back"
                size="lg"
                color="white"
                onPress={onBack}
              />
            )}
            <Heading color="white" size="xl" flex={1}>
              My Children
            </Heading>
          </HStack>
          {parentName && (
            <Text color="coolGray.400" fontSize="md">
              Parent: {parentName}
            </Text>
          )}
          <HStack space={2}>
            <Badge bg="green.500" px={3} py={1} rounded="full">
              <Text color="white" fontSize="xs" fontWeight="600">
                {children.length} {children.length === 1 ? "Child" : "Children"}
              </Text>
            </Badge>
          </HStack>
        </VStack>
      </Box>

      {/* Children List */}
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="lg" color="brand.500" />
          <Text color="coolGray.400" mt={4} fontSize="md">
            Loading children...
          </Text>
        </Box>
      ) : (
        <ScrollView flex={1} px={6} py={4}>
          {children.length === 0 ? (
            <Box mt={10} alignItems="center">
              <Icon as={MaterialIcons} name="child-care" size="4xl" color="coolGray.600" />
              <Text color="coolGray.500" fontSize="lg" mt={4} textAlign="center">
                No children registered yet
              </Text>
              <Text color="coolGray.600" fontSize="sm" mt={2} textAlign="center">
                Tap the + button below to add your first child
              </Text>
            </Box>
          ) : (
            <VStack space={1}>
              {children.map((child) => renderChildCard(child))}
            </VStack>
          )}
        </ScrollView>
      )}

      {/* Floating Add Button */}
      {onAddChild && (
        <Fab
          renderInPortal={false}
          shadow={5}
          size="lg"
          bg="green.600"
          onPress={onAddChild}
          icon={<Icon as={MaterialIcons} name="add" size="lg" color="white" />}
          label={
            <Text color="white" fontSize="md" fontWeight="600">
              Add Child
            </Text>
          }
        />
      )}
    </Box>
  );
}
