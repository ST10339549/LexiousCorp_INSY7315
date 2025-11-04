import React from 'react';
import { Box, IBoxProps } from 'native-base';

interface AppCardProps extends IBoxProps {
  children: React.ReactNode;
}

export const AppCard: React.FC<AppCardProps> = ({ children, ...props }) => {
  return (
    <Box
      bg="white"
      rounded="lg"
      p={4}
      shadow="md"
      borderWidth={1}
      borderColor="gray.100"
      {...props}
    >
      {children}
    </Box>
  );
};
