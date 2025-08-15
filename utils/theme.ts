/**
 * Mafia Game Theme
 * A dark, mysterious theme for the Lan Mafia game
 */

export const MafiaTheme = {
  colors: {
    // Primary colors
    primary: '#a71d31', // Dark red for primary actions
    secondary: '#3F0D12', // Darker red for secondary elements
    background: '#1a1a1a', // Near black background
    card: '#232323', // Slightly lighter than background for cards
    text: '#f5f5f5', // Off-white for main text
    subText: '#b0b0b0', // Light gray for secondary text
    border: '#444444', // Dark gray borders
    placeholder: '#777777', // Medium gray for placeholders
    
    // Role-specific colors
    mafia: '#8B0000', // Dark red for Mafia role
    civilian: '#1B4079', // Dark blue for Civilian role
    detective: '#3A5311', // Dark green for Detective role
    doctor: '#7D5BA6', // Purple for Doctor role
    
    // Status colors
    success: '#2a5e36', // Green for success states
    warning: '#d9a83e', // Gold/amber for warnings
    danger: '#a71d31', // Red for error/danger
    info: '#496480', // Blue-gray for info

    // UI element colors
    buttonText: '#ffffff',
    disabledButton: '#555555',
    inputBackground: '#2c2c2c',
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      bold: 'System',
      italic: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radiuses
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
  
  // Shadows
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  
  // Animations
  animations: {
    durations: {
      short: 200,
      medium: 300,
      long: 500,
    },
  },
};

// Shared component styles
export const MafiaStyles = {
  screen: {
    container: {
      flex: 1,
      backgroundColor: MafiaTheme.colors.background,
      padding: MafiaTheme.spacing.lg,
    },
    centeredContainer: {
      flex: 1,
      backgroundColor: MafiaTheme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: MafiaTheme.spacing.lg,
    },
  },
  
  text: {
    title: {
      fontSize: MafiaTheme.typography.fontSize.xxl,
      fontWeight: 'bold' as const,
      color: MafiaTheme.colors.text,
      marginBottom: MafiaTheme.spacing.lg,
      textAlign: 'center' as const,
    },
    subtitle: {
      fontSize: MafiaTheme.typography.fontSize.xl,
      fontWeight: 'bold' as const,
      color: MafiaTheme.colors.text,
      marginBottom: MafiaTheme.spacing.md,
    },
    paragraph: {
      fontSize: MafiaTheme.typography.fontSize.md,
      color: MafiaTheme.colors.text,
      marginBottom: MafiaTheme.spacing.md,
    },
    label: {
      fontSize: MafiaTheme.typography.fontSize.sm,
      color: MafiaTheme.colors.subText,
      marginBottom: MafiaTheme.spacing.xs,
    },
  },
  
  inputs: {
    textInput: {
      width: '100%',
      backgroundColor: MafiaTheme.colors.inputBackground,
      color: MafiaTheme.colors.text,
      padding: MafiaTheme.spacing.md,
      borderRadius: MafiaTheme.borderRadius.md,
      borderWidth: 1,
      borderColor: MafiaTheme.colors.border,
      fontSize: MafiaTheme.typography.fontSize.md,
      marginBottom: MafiaTheme.spacing.md,
    },
  },
  
  buttons: {
    primary: {
      backgroundColor: MafiaTheme.colors.primary,
      padding: MafiaTheme.spacing.md,
      borderRadius: MafiaTheme.borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: MafiaTheme.spacing.sm,
      ...MafiaTheme.shadows.medium,
    },
    secondary: {
      backgroundColor: MafiaTheme.colors.secondary,
      padding: MafiaTheme.spacing.md,
      borderRadius: MafiaTheme.borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: MafiaTheme.spacing.sm,
      ...MafiaTheme.shadows.medium,
    },
    outline: {
      backgroundColor: 'transparent',
      padding: MafiaTheme.spacing.md,
      borderRadius: MafiaTheme.borderRadius.md,
      borderWidth: 1,
      borderColor: MafiaTheme.colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: MafiaTheme.spacing.sm,
    },
    text: {
      fontSize: MafiaTheme.typography.fontSize.md,
      fontWeight: 'bold' as const,
      color: MafiaTheme.colors.buttonText,
    },
  },
  
  cards: {
    container: {
      backgroundColor: MafiaTheme.colors.card,
      borderRadius: MafiaTheme.borderRadius.md,
      padding: MafiaTheme.spacing.md,
      marginVertical: MafiaTheme.spacing.sm,
      ...MafiaTheme.shadows.medium,
    },
  },
  
  layouts: {
    row: {
      flexDirection: 'row' as const,
      width: '100%',
      justifyContent: 'space-between' as const,
      marginVertical: MafiaTheme.spacing.sm,
    },
  },
};
