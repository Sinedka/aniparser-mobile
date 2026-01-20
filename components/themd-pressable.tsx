import { Pressable, PressableProps, PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';

import { useThemeColor } from '../hooks/use-theme-color';

export type ThemedPressableProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedPressable({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedPressableProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  const combinedStyle = (state: PressableStateCallbackType) => {
    const userStyle = typeof style === 'function' ? style(state) : style;
    return [{ backgroundColor }, userStyle];
  };

  return <Pressable style={combinedStyle} {...otherProps} />;
}

