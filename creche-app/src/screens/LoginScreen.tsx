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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
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
    if (onLogin) {
      await onLogin(data.email, data.password);
    } else {
      console.log("Login pressed", data);
    }
  }

  return (
    <Box flex={1} bg="bg.900" px={6} py={12} alignItems="center">
      <Box bg="bg.800" w="100%" maxW="400px" p={6} rounded="2xl">
        <VStack space={4}>
          <Text color="white" fontSize="xl" fontWeight="600">
            Welcome back, please sign in
          </Text>
          <Text color="coolGray.400" fontSize="sm">
            Log in to Little Lemon Creche
          </Text>

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

          {/* Login button */}
          <Button
            mt={2}
            bg="brand.500"
            _pressed={{ opacity: 0.8 }}
            rounded="lg"
            onPress={handleSubmit(submit)}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? <Spinner color="white" /> : "Log In"}
          </Button>

          {/* Switch to Register */}
          <Pressable
            onPress={onGoRegister}
            alignSelf="center"
            mt={2}
            _pressed={{ opacity: 0.6 }}
          >
            <Text color="coolGray.400" fontSize="xs">
              Don't have an account?{" "}
              <Text color="brand.500" fontWeight="600">
                Register
              </Text>
            </Text>
          </Pressable>
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
