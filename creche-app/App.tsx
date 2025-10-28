import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NativeBaseProvider, Box, Text, Button } from 'native-base';

export default function App() {
  return (
    <NativeBaseProvider>
      <Box style={styles.container}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>
          Little Lemon Crèche App
        </Text>
        <Text color="gray.500" mb={6}>
          Welcome!
        </Text>
        <Button>Get Started</Button>
        <StatusBar style="auto" />
      </Box>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
