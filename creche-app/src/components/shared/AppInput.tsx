import React from 'react';
import { Input as NBInput, FormControl, IInputProps } from 'native-base';

interface AppInputProps extends IInputProps {
  label?: string;
  error?: string;
  isRequired?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  isRequired,
  ...props
}) => {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && (
        <FormControl.Label
          _text={{
            color: 'gray.700',
            fontSize: 'sm',
            fontWeight: '500',
          }}
        >
          {label}
        </FormControl.Label>
      )}
      <NBInput
        bg="white"
        borderColor={error ? 'error.500' : 'gray.200'}
        rounded="lg"
        fontSize="md"
        px={4}
        py={3}
        _focus={{
          borderColor: error ? 'error.500' : 'primary.400',
          bg: 'white',
          borderWidth: 2,
        }}
        {...props}
      />
      {error && (
        <FormControl.ErrorMessage
          _text={{
            fontSize: 'xs',
            color: 'error.500',
          }}
        >
          {error}
        </FormControl.ErrorMessage>
      )}
    </FormControl>
  );
};
