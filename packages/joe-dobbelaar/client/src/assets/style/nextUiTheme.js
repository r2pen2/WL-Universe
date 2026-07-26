// Library Imports
import { createTheme } from "@nextui-org/react";

/** Default NextUI compatible theme object (lightmode only for now) */
export const nextUiTheme = createTheme({
  type: "dark", // it could be "light" or "dark"
  theme: {
    colors: {
      primaryLight: "$purple200",
      primaryLightHover: "$purple300",
      primaryLightActive: "$purple400",
      primaryLightContrast: "$purple600",
      primary: "$purple600",
      primaryBorder: "$purple500",
      primaryBorderHover: "$purple600",
      primarySolidHover: "$purple700",
      primarySolidContrast: "#ffffff",
      primaryShadow: "$purple600",

      success: "#A6C437",
      white: "#ffffff",  
    },
    space: {},
    fonts: {},
    fontSizes: {
      xs: '0.75rem', 
      sm: '0.875rem', 
      base: '1rem', 
      md: '1rem', 
      lg: '1.125rem', 
      xl: '1.25rem', 
      '2xl': '1.5rem', 
      '3xl': '1.875rem', 
      '4xl': '2.25rem', 
      '5xl': '3rem', 
      '6xl': '3.75rem', 
      '7xl': '4.5rem', 
      '8xl': '6rem', 
      '9xl': '8rem', 
    },
  }
})