import React from "react";
import { Box, VStack, Text, Button, HStack, Heading } from "native-base";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

type AdminDashboardProps = {
    userName?: string;
    onLogout?: () => void;
};

export default function AdminDashboard({ userName, onLogout }: AdminDashboardProps) {
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
                            Admin Dashboard
                        </Heading>
                        <Text color="coolGray.400" fontSize="md">
                            Welcome back, {userName || "Admin"}
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

                <Box bg="brand.500" p={4} rounded="xl">
                    <Text color="white" textAlign="center" fontWeight="500">
                        Admin Dashboard - Features coming soon!
                    </Text>
                </Box>
            </VStack>
        </Box>
    );
}
