import { DefaultTheme } from 'react-native-paper';

export default {
  ...DefaultTheme,
  roundness: 5,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0271cd',
    accent: '#1C4442',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    light: 'System',
    thin: 'System',
  },
};
