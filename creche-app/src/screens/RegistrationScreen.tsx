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

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Use a valid email"),
    password: z.string().min(6, "Min 6 characters"),
    confirm: z.string().min(6, "Confirm your password"),
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
    if (onRegister) {
      await onRegister({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
    } else {
      console.log("Register pressed", data);
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
