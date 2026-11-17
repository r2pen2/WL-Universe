import { createTheme } from "@nextui-org/react";

/** NextUI theme (used by web-legos' edit controls and auth buttons) in the site's palette. */
export const nextUiTheme = createTheme({
  type: "light",
  theme: {
    colors: {
      primaryLight: "#CBCBD3",
      primaryLightHover: "#B0B0B5",
      primaryLightActive: "#B0B0B5",
      primaryLightContrast: "#0D0E26",
      primary: "#41425F",
      primaryBorder: "#41425F",
      primaryBorderHover: "#0D0E26",
      primarySolidHover: "#0D0E26",
      primarySolidContrast: "#F6F5F2",
      primaryShadow: "#41425F",
    },
    fonts: {
      sans: "'Wix Madefor Text', Helvetica, Arial, sans-serif",
    },
  },
});
