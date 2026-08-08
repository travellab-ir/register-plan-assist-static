import { createMuiTheme, responsiveFontSizes } from '@material-ui/core';
import { purple } from '@material-ui/core/colors';

// Breakpoints kept close to MUI defaults but named explicitly so every
// component in the app reasons about the same three tiers instead of
// inventing its own pixel thresholds.
//   mobile: 0-599   tablet: 600-959   desktop: 960+
let theme = createMuiTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 }
  },
  palette: {
    primary: { main: '#596BEC' },
    secondary: { main: '#00BCD4' }
  }
});

theme = responsiveFontSizes(theme);

// A handful of icon buttons across the app (dense toolbars, table/card row
// actions) use size="small" to save space — that's fine for a mouse, but
// its ~30px hit area falls short of the ~44px minimum touch target. Rather
// than hunting down every instance, key this off the pointer itself: any
// device without a precise pointer (touchscreens, including a touch laptop
// at desktop width) gets a bigger hit area without changing the visible
// icon size or affecting mouse users on the same viewport width.
theme = createMuiTheme(theme, {
  overrides: {
    MuiIconButton: {
      sizeSmall: {
        '@media (pointer: coarse)': {
          minWidth: 44,
          minHeight: 44
        }
      }
    }
  }
});

declare module '@material-ui/core/styles/createPalette' {
  interface Palette {
    extraColors: {
      normalFlight: string;
      canceledFlight: string;
      erroredFlight: string;
      warnedFlight: string;
      includedRegister: string;
      backupRegister: string;
      ignoredRegister: string;
    };
  }
}
theme.palette.extraColors = {
  normalFlight: '#0099FF',
  canceledFlight: '#BB8C59',
  erroredFlight: '#FF3300',
  warnedFlight: '#FF9933',
  includedRegister: '#FFFFFF',
  backupRegister: '#FFFFCC',
  ignoredRegister: '#CCCCCC'
};

export default theme;
