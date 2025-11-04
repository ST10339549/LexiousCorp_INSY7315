import React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  VStack,
  Text,
  Heading,
  Spinner,
  Pressable,
  HStack,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { AppButton, AppInput } from "../components/shared";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase()
    .refine((val) => val.trim().length > 0, {
      message: "Email cannot be empty",
    }),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginScreenProps = {
  // we'll wire these later
  onLogin?: (email: string, password: string) => Promise<void>;
  onGoRegister?: () => void;
};

export default function LoginScreen({
  onLogin,
  onGoRegister,
}: LoginScreenProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(data: LoginFormData) {
    console.log("Login submit function called");
    try {
      if (onLogin) {
        console.log("Calling onLogin with email:", data.email);
        await onLogin(data.email, data.password);
        console.log("onLogin completed successfully");
      } else {
        console.log("No onLogin prop provided");
        console.log("Login pressed", data);
      }
    } catch (error) {
      console.error("Error in login submit function:", error);
      if (error instanceof Error) {
        alert("Login Error: " + error.message);
      }
    }
  }

  return (
    <Box flex={1} bg="background.secondary" safeArea>
      {/* Header with Logo/Icon */}
      <VStack space={6} px={6} py={8} alignItems="center">
        <Box
          bg="primary.400"
          rounded="full"
          p={5}
          shadow="lg"
          mb={2}
        >
          <Ionicons name="home" size={48} color="white" />
        </Box>
        
        <VStack space={1} alignItems="center">
          <Heading size="xl" color="gray.800" fontWeight="700">
            Creche Connect
          </Heading>
          <Text color="gray.500" fontSize="md">
            Welcome back! Please sign in to continue
          </Text>
        </VStack>
      </VStack>

      {/* Login Form Card */}
      <Box px={6} flex={1}>
        <Box
          bg="white"
          rounded="lg"
          p={6}
          shadow="md"
          borderWidth={1}
          borderColor="gray.100"
        >
          <VStack space={4}>
            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <AppInput
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  isRequired
                />
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <AppInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password?.message}
                  isRequired
                />
              )}
            />

            {/* Login Button */}
            <AppButton
              mt={2}
              colorScheme="primary"
              onPress={handleSubmit(submit)}
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              isLoadingText="Signing in..."
            >
              {isSubmitting ? <Spinner color="white" /> : "Sign In"}
            </AppButton>

            {/* Divider */}
            <HStack alignItems="center" space={2} my={2}>
              <Box flex={1} h="1px" bg="gray.200" />
              <Text color="gray.400" fontSize="xs">
                OR
              </Text>
              <Box flex={1} h="1px" bg="gray.200" />
            </HStack>

            {/* Register Link */}
            <Pressable
              onPress={onGoRegister}
              alignSelf="center"
              p={2}
              rounded="md"
              _pressed={{ bg: "gray.50" }}
            >
              <HStack space={1} alignItems="center">
                <Text color="gray.600" fontSize="sm">
                  Don't have an account?
                </Text>
                <Text color="primary.400" fontSize="sm" fontWeight="600">
                  Register Now
                </Text>
              </HStack>
            </Pressable>
          </VStack>
        </Box>

        {/* Footer Info */}
        <VStack space={2} alignItems="center" mt={8}>
          <HStack space={2} alignItems="center">
            <Ionicons name="shield-checkmark" size={16} color="#4CC38A" />
            <Text color="gray.500" fontSize="xs">
              Secure & encrypted login
            </Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}

async function handleLogin(email: string, password: string) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    alert("Welcome back, " + userCred.user.displayName);
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert("Login failed: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
  }
}

//<LoginScreen onLogin={handleLogin} onGoRegister={() => setMode("register")} />
