import React from "react";
import { Box, VStack, Text, Button, HStack, Heading } from "native-base";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

type ParentHomeProps = {
    userName?: string;
    onLogout?: () => void;
    onNavigateToAddChild?: () => void;
    onNavigateToMyChildren?: () => void;
};

export default function ParentHome({ userName, onLogout, onNavigateToAddChild, onNavigateToMyChildren }: ParentHomeProps) {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            if (onLogout) onLogout();
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout");
        }
    };

    return (
        <Box flex={1} bg="bg.900" px={6} py={12}>
            <VStack space={6}>
                {/* Header */}
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack>
                        <Heading color="white" size="xl">
                            Parent Portal
                        </Heading>
                        <Text color="coolGray.400" fontSize="md">
                            Welcome, {userName || "Parent"}
                        </Text>
                    </VStack>
                    <Button
                        onPress={handleLogout}
                        variant="outline"
                        borderColor="red.500"
                        _text={{ color: "red.500" }}
                    >
                        Logout
                    </Button>
                </HStack>

                {/* Parent Actions */}
                <VStack space={4}>
                    {/* My Children Button */}
                    <Button
                        bg="brand.500"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToMyChildren && onNavigateToMyChildren()}
                        _pressed={{ bg: "brand.600" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">👨‍👩‍👧‍👦</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                My Children
                            </Text>
                        </HStack>
                    </Button>

                    {/* Add Child Button */}
                    <Button
                        bg="green.600"
                        rounded="xl"
                        py={4}
                        onPress={() => onNavigateToAddChild && onNavigateToAddChild()}
                        _pressed={{ bg: "green.700" }}
                    >
                        <HStack space={3} alignItems="center">
                            <Text fontSize="xl">👶</Text>
                            <Text color="white" fontSize="md" fontWeight="500">
                                Add Child
                            </Text>
                        </HStack>
                    </Button>

                    {/* Placeholder for future features */}
                    <Box bg="coolGray.800" p={4} rounded="xl" borderWidth={1} borderColor="coolGray.700">
                        <Text color="coolGray.400" textAlign="center" fontWeight="500">
                            Parent Portal Dashboard - Features coming soon!
                        </Text>
                    </Box>
                </VStack>
            </VStack>
        </Box>
    );
}
