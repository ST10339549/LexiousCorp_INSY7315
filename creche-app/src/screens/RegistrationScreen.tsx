import React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  VStack,
  Text,
  FormControl,
  Input,
  Button,
  Spinner,
  Pressable,
} from "native-base";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";

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
    <Box flex={1} bg="bg.900" px={6} py={12} alignItems="center">
      <Box bg="bg.800" w="100%" maxW="400px" p={6} rounded="2xl">
        <VStack space={4}>
          <Text color="white" fontSize="xl" fontWeight="600">
            Create account ✨
          </Text>
          <Text color="coolGray.400" fontSize="sm">
            Parent / Admin access to Little Lemon Creche
          </Text>

          {/* Name */}
          <FormControl isInvalid={"fullName" in errors}>
            <FormControl.Label _text={{ color: "coolGray.300" }}>
              Full Name
            </FormControl.Label>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { value, onChange } }) => (
                <Input
                  bg="bg.700"
                  color="white"
                  borderColor="bg.700"
                  rounded="lg"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Melissa Pillay"
                  placeholderTextColor="#666"
                  _focus={{
                    borderColor: "brand.500",
                    borderWidth: 2,
                  }}
                />
              )}
            />
            {errors.fullName && (
              <FormControl.ErrorMessage>
                {errors.fullName.message}
              </FormControl.ErrorMessage>
            )}
          </FormControl>

          {/* Email */}
          <FormControl isInvalid={"email" in errors}>
            <FormControl.Label _text={{ color: "coolGray.300" }}>
              Email
            </FormControl.Label>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <Input
                  bg="bg.700"
                  color="white"
                  borderColor="bg.700"
                  rounded="lg"
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@email.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  _focus={{
                    borderColor: "brand.500",
                    borderWidth: 2,
                  }}
                />
              )}
            />
            {errors.email && (
              <FormControl.ErrorMessage>
                {errors.email.message}
              </FormControl.ErrorMessage>
            )}
          </FormControl>

          {/* Password */}
          <FormControl isInvalid={"password" in errors}>
            <FormControl.Label _text={{ color: "coolGray.300" }}>
              Password
            </FormControl.Label>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <Input
                  bg="bg.700"
                  color="white"
                  borderColor="bg.700"
                  rounded="lg"
                  value={value}
                  onChangeText={onChange}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  secureTextEntry
                  _focus={{
                    borderColor: "brand.500",
                    borderWidth: 2,
                  }}
                />
              )}
            />
            {errors.password && (
              <FormControl.ErrorMessage>
                {errors.password.message}
              </FormControl.ErrorMessage>
            )}
          </FormControl>

          {/* Confirm Password */}
          <FormControl isInvalid={"confirm" in errors}>
            <FormControl.Label _text={{ color: "coolGray.300" }}>
              Confirm Password
            </FormControl.Label>
            <Controller
              control={control}
              name="confirm"
              render={({ field: { value, onChange } }) => (
                <Input
                  bg="bg.700"
                  color="white"
                  borderColor="bg.700"
                  rounded="lg"
                  value={value}
                  onChangeText={onChange}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  secureTextEntry
                  _focus={{
                    borderColor: "brand.500",
                    borderWidth: 2,
                  }}
                />
              )}
            />
            {errors.confirm && (
              <FormControl.ErrorMessage>
                {errors.confirm.message}
              </FormControl.ErrorMessage>
            )}
          </FormControl>

          {/* Register button */}
          <Button
            mt={2}
            bg="brand.500"
            _pressed={{ opacity: 0.8 }}
            rounded="lg"
            onPress={handleSubmit(submit)}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? <Spinner color="white" /> : "Create Account"}
          </Button>

          {/* Switch to Login */}
          <Pressable
            onPress={onGoLogin}
            alignSelf="center"
            mt={2}
            _pressed={{ opacity: 0.6 }}
          >
            <Text color="coolGray.400" fontSize="xs">
              Already registered?{" "}
              <Text color="brand.500" fontWeight="600">
                Log in
              </Text>
            </Text>
          </Pressable>
        </VStack>
      </Box>
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
