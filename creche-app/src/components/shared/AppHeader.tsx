import React from 'react';
import { Box, HStack, Heading, Pressable, IBoxProps } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps extends IBoxProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
  ...props
}) => {
  return (
    <Box
      bg="white"
      px={4}
      py={3}
      safeAreaTop
      shadow="sm"
      borderBottomWidth={1}
      borderBottomColor="gray.100"
      {...props}
    >
      <HStack alignItems="center" justifyContent="space-between">
        <HStack alignItems="center" space={2} flex={1}>
          {onBack && (
            <Pressable
              onPress={onBack}
              p={2}
              rounded="full"
              _pressed={{ bg: 'gray.100' }}
            >
              <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
            </Pressable>
          )}
          <Box flex={1}>
            <Heading size="md" color="gray.800" fontWeight="700">
              {title}
            </Heading>
            {subtitle && (
              <Heading size="xs" color="gray.500" fontWeight="400" mt={0.5}>
                {subtitle}
              </Heading>
            )}
          </Box>
        </HStack>
        {rightElement && <Box>{rightElement}</Box>}
      </HStack>
    </Box>
  );
};
