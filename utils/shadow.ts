import { Platform } from 'react-native';

export const createBoxShadow = (
  color: string = '#000',
  offset: { width: number; height: number } = { width: 0, height: 1 },
  opacity: number = 0.1,
  radius: number = 3,
  elevation: number = 2
) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`
    };
  }
  
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation
  };
};

const hexToRgb = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};
