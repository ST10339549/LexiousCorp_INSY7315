import { extendTheme } from 'native-base';

export const crecheTheme = extendTheme({
  colors: {
    // Primary brand colors
    primary: {
      50: '#E8F0FF',
      100: '#C2D9FF',
      200: '#9BC2FF',
      300: '#75ABFF',
      400: '#5C8DFF', // Main Academy Blue
      500: '#5C8DFF',
      600: '#4A71CC',
      700: '#385599',
      800: '#263966',
      900: '#141D33',
    },
    // Accent - Lavender Purple
    accent: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA', // Main Lavender
      500: '#A78BFA',
      600: '#8B5CF6',
      700: '#7C3AED',
      800: '#6D28D9',
      900: '#5B21B6',
    },
    // Success - Green
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#4CC38A', // Main Success
      500: '#4CC38A',
      600: '#10B981',
      700: '#059669',
      800: '#047857',
      900: '#065F46',
    },
    // Error - Red
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444', // Main Error
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    // Warning - Orange
    warning: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    // Info - Cyan
    info: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },
    // Gray scale
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280', // Text Secondary
      600: '#4B5563',
      700: '#374151',
      800: '#2D2D2D', // Text Primary
      900: '#111827',
    },
    // Surface colors
    surface: {
      50: '#FFFFFF',
      100: '#F7F9FC', // Main Surface
      200: '#F3F4F6',
      300: '#E5E7EB',
    },
    // Background
    background: {
      primary: '#FFFFFF',
      secondary: '#F7F9FC',
      tertiary: '#F3F4F6',
    },
  },
  fontConfig: {
    Inter: {
      100: {
        normal: 'Inter-Light',
        italic: 'Inter-LightItalic',
      },
      200: {
        normal: 'Inter-Light',
        italic: 'Inter-LightItalic',
      },
      300: {
        normal: 'Inter-Light',
        italic: 'Inter-LightItalic',
      },
      400: {
        normal: 'Inter-Regular',
        italic: 'Inter-Italic',
      },
      500: {
        normal: 'Inter-Medium',
        italic: 'Inter-MediumItalic',
      },
      600: {
        normal: 'Inter-SemiBold',
        italic: 'Inter-SemiBoldItalic',
      },
      700: {
        normal: 'Inter-Bold',
        italic: 'Inter-BoldItalic',
      },
      800: {
        normal: 'Inter-ExtraBold',
        italic: 'Inter-ExtraBoldItalic',
      },
      900: {
        normal: 'Inter-Black',
        italic: 'Inter-BlackItalic',
      },
    },
    Nunito: {
      100: {
        normal: 'Nunito-Light',
        italic: 'Nunito-LightItalic',
      },
      200: {
        normal: 'Nunito-Light',
        italic: 'Nunito-LightItalic',
      },
      300: {
        normal: 'Nunito-Light',
        italic: 'Nunito-LightItalic',
      },
      400: {
        normal: 'Nunito-Regular',
        italic: 'Nunito-Italic',
      },
      500: {
        normal: 'Nunito-Medium',
        italic: 'Nunito-MediumItalic',
      },
      600: {
        normal: 'Nunito-SemiBold',
        italic: 'Nunito-SemiBoldItalic',
      },
      700: {
        normal: 'Nunito-Bold',
        italic: 'Nunito-BoldItalic',
      },
      800: {
        normal: 'Nunito-ExtraBold',
        italic: 'Nunito-ExtraBoldItalic',
      },
      900: {
        normal: 'Nunito-Black',
        italic: 'Nunito-BlackItalic',
      },
    },
  },
  fonts: {
    heading: 'system',
    body: 'system',
    mono: 'Courier',
  },
  fontSizes: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  space: {
    px: '1px',
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
    40: 160,
    48: 192,
    56: 224,
    64: 256,
  },
  radii: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16, // Main radius
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  shadows: {
    // Soft shadows for cards
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'lg',
        _text: {
          fontWeight: '600',
          fontSize: 'md',
        },
      },
      defaultProps: {
        colorScheme: 'primary',
        size: 'lg',
      },
      variants: {
        solid: (props: any) => ({
          bg: `${props.colorScheme}.400`,
          _pressed: {
            bg: `${props.colorScheme}.600`,
          },
          _text: {
            color: 'white',
          },
        }),
        outline: (props: any) => ({
          borderColor: `${props.colorScheme}.400`,
          borderWidth: 2,
          _text: {
            color: `${props.colorScheme}.400`,
          },
          _pressed: {
            bg: `${props.colorScheme}.50`,
          },
        }),
        ghost: (props: any) => ({
          _text: {
            color: `${props.colorScheme}.400`,
          },
          _pressed: {
            bg: `${props.colorScheme}.50`,
          },
        }),
      },
    },
    Input: {
      baseStyle: {
        rounded: 'lg',
        borderColor: 'gray.200',
        fontSize: 'md',
        px: 4,
        py: 3,
        _focus: {
          borderColor: 'primary.400',
          bg: 'white',
        },
      },
      defaultProps: {
        size: 'lg',
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.800',
      },
      variants: {
        heading: {
          fontFamily: 'heading',
          fontWeight: '700',
          color: 'gray.800',
        },
        subheading: {
          fontFamily: 'heading',
          fontWeight: '600',
          color: 'gray.700',
        },
        body: {
          fontFamily: 'body',
          fontWeight: '400',
          color: 'gray.800',
        },
        caption: {
          fontFamily: 'body',
          fontWeight: '400',
          fontSize: 'sm',
          color: 'gray.500',
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'gray.800',
        fontWeight: '700',
        fontFamily: 'heading',
      },
    },
    Card: {
      baseStyle: {
        rounded: 'lg',
        bg: 'white',
        p: 4,
        shadow: 'md',
      },
    },
  },
  config: {
    initialColorMode: 'light',
  },
});

export type CrecheTheme = typeof crecheTheme;
