/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const MediQImages = {
  icon: require('../assets/images/icon.png'),
  logo: require('../assets/images/logo.png'),
  main_bg: require('../assets/images/main_bg.png'),
  main_bg_top: require('../assets/images/main_bg_top.png'),
  doctor_avatar_main: require('../assets/images/doctor_avatar_main.png'),
  patient_avatar_main: require('../assets/images/patient_avatar_main.png'),
  doctor_avatar_standing: require('../assets/images/doctor_avatar_standing.png'),
  mediq_inline_logo: require('../assets/images/mediq_inline_logo.png'),
  navbar_icon_sessions: require('../assets/images/navbar_icon_sessions.png'),
  navbar_icon_requests: require('../assets/images/navbar_icon_requests.png'),
  navbar_icon_settings: require('../assets/images/navbar_icon_settings.png'),
  session_add_icon: require('../assets/images/session_add_icon.png'),
  queue_absent_icon: require('../assets/images/queue_absent_icon.png'),
  queue_continue_icon: require('../assets/images/queue_continue_icon.png'),
  queue_pause_icon: require('../assets/images/queue_pause_icon.png'),
  queue_served_icon: require('../assets/images/queue_served_icon.png'),
};