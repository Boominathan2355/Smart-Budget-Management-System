import React from 'react';
import { TouchableOpacity as RNTouchableOpacity, TouchableOpacityProps, Platform, ViewStyle, StyleProp } from 'react-native';

export function TouchableOpacity({ style, ...props }: TouchableOpacityProps) {
  const webStyles = Platform.OS === 'web' ? {
    cursor: 'pointer',
    style: {
      ...(style as ViewStyle),
      pointerEvents: 'auto'
    } as StyleProp<ViewStyle>
  } : { style };

  return <RNTouchableOpacity {...props} {...webStyles} />;
}
