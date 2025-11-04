import React from 'react';
import { Button as NBButton, IButtonProps } from 'native-base';

interface AppButtonProps extends IButtonProps {
  children: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({ children, ...props }) => {
  return (
    <NBButton
      rounded="lg"
      shadow="sm"
      _text={{
        fontWeight: '600',
        fontSize: 'md',
      }}
      py={3}
      {...props}
    >
      {children}
    </NBButton>
  );
};
