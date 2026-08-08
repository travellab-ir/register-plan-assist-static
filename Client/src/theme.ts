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
