// Library Imports
import { createTheme } from "@nextui-org/react";

export const creamy = "#f9f3c4"
export const red700 = '#dd1522'
export const red600 = '#EF2427'
export const red500 = '#fd3127'
export const red400 = '#f94745'
export const red300 = '#ee6c6c'
export const red200 = '#f69695'
export const backgroundDark = "#070709"
export const backgroundLight = "#171c1f"
export const backgroundLighter = "#1E1D21"

/** Default NextUI compatible theme object (lightmode only for now) */
export const nextUiTheme = createTheme({
  type: "dark", // it could be "light" or "dark"
  theme: {
    colors: {

      background: backgroundDark,

      primaryLight: red200,
      primaryLightHover: red300,
      primaryLightActive: red400,
      primaryLightContrast: red600,
      primary: red600,
      primaryBorder: red500,
      primaryBorderHover: red600,
      primarySolidHover: red700,
      primarySolidContrast: creamy,
      primaryShadow: red600,

      creamy: creamy,

      text: "#ffffff",

      secondaryLight: "$purple200",
      secondaryLightHover: "$purple300",
      secondaryLightActive: "$purple400",
      secondaryLightContrast: "$purple600",
      secondary: "$purple600",
      secondaryBorder: "$purple500",
      secondaryBorderHover: "$purple600",
      secondarySolidHover: "$purple700",
      secondarySolidContrast: "#ffffff",
      secondaryShadow: "$purple600",

      success: "#A6C437",
      white: "#ffffff",
      accent: "#fff8c8"  
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