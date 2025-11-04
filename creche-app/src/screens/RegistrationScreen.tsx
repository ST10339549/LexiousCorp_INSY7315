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
  ScrollView,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { AppButton, AppInput } from "../components/shared";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
      .refine((val) => val.trim().length > 0, {
        message: "Full name cannot be empty",
      }),
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
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type RegisterScreenProps = {
  onRegister?: (data: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onGoLogin?: () => void;
};

export default function RegisterScreen({
  onRegister,
  onGoLogin,
}: RegisterScreenProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  async function submit(data: RegisterFormData) {
    console.log("Submit function called with data:", data);
    try {
      if (onRegister) {
        console.log("Calling onRegister...");
        await onRegister({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        });
        console.log("onRegister completed successfully");
      } else {
        console.log("No onRegister prop provided");
        console.log("Register pressed", data);
      }
    } catch (error) {
      console.error("Error in submit function:", error);
      if (error instanceof Error) {
        alert("Error: " + error.message);
      }
    }
  }

  return (
    <Box flex={1} bg="background.secondary" safeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <VStack space={4} px={6} py={6} alignItems="center">
          <Box
            bg="accent.400"
            rounded="full"
            p={5}
            shadow="lg"
          >
            <Ionicons name="person-add" size={40} color="white" />
          </Box>
          
          <VStack space={1} alignItems="center">
            <Heading size="xl" color="gray.800" fontWeight="700">
              Create Account
            </Heading>
            <Text color="gray.500" fontSize="md" textAlign="center">
              Join Creche Connect
            </Text>
          </VStack>
        </VStack>

        {/* Registration Form Card */}
        <Box px={6} pb={8}>
          <Box
            bg="white"
            rounded="lg"
            p={6}
            shadow="md"
            borderWidth={1}
            borderColor="gray.100"
          >
            <VStack space={4}>
              {/* Full Name Input */}
              <Controller
                control={control}
                name="fullName"
                render={({ field: { value, onChange } }) => (
                  <AppInput
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="John Doe"
                    error={errors.fullName?.message}
                    isRequired
                  />
                )}
              />

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
                    placeholder="Create a strong password"
                    secureTextEntry
                    error={errors.password?.message}
                    isRequired
                  />
                )}
              />

              {/* Password Requirements */}
              <Box bg="info.50" p={3} rounded="md" borderWidth={1} borderColor="info.200">
                <VStack space={1}>
                  <Text fontSize="xs" color="info.700" fontWeight="600">
                    Password must contain:
                  </Text>
                  <HStack space={1} alignItems="center">
                    <Ionicons name="checkmark-circle" size={14} color="#06B6D4" />
                    <Text fontSize="xs" color="info.700">At least 8 characters</Text>
                  </HStack>
                  <HStack space={1} alignItems="center">
                    <Ionicons name="checkmark-circle" size={14} color="#06B6D4" />
                    <Text fontSize="xs" color="info.700">Upper & lowercase letters</Text>
                  </HStack>
                  <HStack space={1} alignItems="center">
                    <Ionicons name="checkmark-circle" size={14} color="#06B6D4" />
                    <Text fontSize="xs" color="info.700">Numbers & special characters</Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Confirm Password Input */}
              <Controller
                control={control}
                name="confirm"
                render={({ field: { value, onChange } }) => (
                  <AppInput
                    label="Confirm Password"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Re-enter your password"
                    secureTextEntry
                    error={errors.confirm?.message}
                    isRequired
                  />
                )}
              />

              {/* Register Button */}
              <AppButton
                mt={2}
                colorScheme="accent"
                onPress={handleSubmit(submit)}
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                isLoadingText="Creating account..."
              >
                {isSubmitting ? <Spinner color="white" /> : "Create Account"}
              </AppButton>

              {/* Divider */}
              <HStack alignItems="center" space={2} my={2}>
                <Box flex={1} h="1px" bg="gray.200" />
                <Text color="gray.400" fontSize="xs">
                  OR
                </Text>
                <Box flex={1} h="1px" bg="gray.200" />
              </HStack>

              {/* Login Link */}
              <Pressable
                onPress={onGoLogin}
                alignSelf="center"
                p={2}
                rounded="md"
                _pressed={{ bg: "gray.50" }}
              >
                <HStack space={1} alignItems="center">
                  <Text color="gray.600" fontSize="sm">
                    Already have an account?
                  </Text>
                  <Text color="primary.400" fontSize="sm" fontWeight="600">
                    Sign In
                  </Text>
                </HStack>
              </Pressable>
            </VStack>
          </Box>

          {/* Footer Info */}
          <VStack space={2} alignItems="center" mt={6}>
            <HStack space={2} alignItems="center">
              <Ionicons name="shield-checkmark" size={16} color="#4CC38A" />
              <Text color="gray.500" fontSize="xs">
                Your data is secure and encrypted
              </Text>
            </HStack>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}

async function handleRegister({
  fullName,
  email,
  password,
}: {
  fullName: string;
  email: string;
  password: string;
}) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: fullName });
    await setDoc(doc(db, "users", userCred.user.uid), {
      name: fullName,
      email: email,
      role: "parent", // or admin
      createdAt: new Date().toISOString(),
    });
    alert("Account created successfully!");
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert("Registration failed: " + err.message);
    } else {
      alert("An unknown error occurred.");
    }
  }
}

// <RegisterScreen onRegister={handleRegister} onGoLogin={() => setMode("login")} />
