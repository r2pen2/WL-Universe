import { createTheme } from "@nextui-org/react";

const white = "#ffffff";

export const theme = createTheme({
  type: "light", // it could be "light" or "dark"
  theme: {
    colors: {
      primaryLight: "$purple200",
      primaryLightHover: "$purple300",
      primaryLightActive: "#890058",
      primaryLightContrast: "#730050",
      primary: "#4F0341",
      primaryBorder: "#730050",
      primaryBorderHover: "#730050",
      primarySolidHover: "#37034f",
      primarySolidContrast: white,
      primaryShadow: "#730050",

      success: "#A6C437",
      white: "#ffffff",
    },
    space: {},
    fonts: {
      sans: 'Ysabeau Infant',
      mono: 'Ysabeau Infant',
    },
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

export const mobileSizes = {
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
}

export const largeSizes = {
  xs: '0.875rem', 
  sm: '1rem', 
  base: '1.125rem', 
  md: '1.125rem', 
  lg: '1.25rem', 
  xl: '1.5rem', 
  '2xl': '1.875rem', 
  '3xl': '2.25rem', 
  '4xl': '3rem', 
  '5xl': '3.75rem', 
  '6xl': '4.5rem', 
  '7xl': '6rem', 
  '8xl': '7.5rem', 
  '9xl': '8rem', 
}

export const themeLarge = createTheme({
  type: "light", // it could be "light" or "dark"
  theme: {
    colors: {
      primaryLight: "$purple200",
      primaryLightHover: "$purple300",
      primaryLightActive: "#890058",
      primaryLightContrast: "#730050",
      primary: "#4F0341",
      primaryBorder: "#730050",
      primaryBorderHover: "#730050",
      primarySolidHover: "#37034f",
      primarySolidContrast: white,
      primaryShadow: "#730050",

      success: "#A6C437",
      white: "#ffffff",
    },
    space: {},
    fonts: {
      sans: 'Ysabeau Infant',
      mono: 'Ysabeau Infant',
    },
    fontSizes: largeSizes
  }
})
export const themeExtraLarge = createTheme({
  type: "light", // it could be "light" or "dark"
  theme: {
    colors: {
      primaryLight: "$purple200",
      primaryLightHover: "$purple300",
      primaryLightActive: "#890058",
      primaryLightContrast: "#730050",
      primary: "#4F0341",
      primaryBorder: "#730050",
      primaryBorderHover: "#730050",
      primarySolidHover: "#37034f",
      primarySolidContrast: white,
      primaryShadow: "#730050",

      success: "#A6C437",
      white: "#ffffff",
    },
    space: {},
    fonts: {
      sans: 'Ysabeau Infant',
    },
    fontSizes: {
      xs: '1.05875rem', 
      sm: '1.1rem', 
      base: '1.2rem', 
      md: '1.2rem', 
      lg: '1.5125rem', 
      xl: '1.815rem', 
      '2xl': '1.875rem', 
      '3xl': '2.25rem', 
      '4xl': '3rem', 
      '5xl': '3.75rem', 
      '6xl': '4.5rem', 
      '7xl': '6rem', 
      '8xl': '7.5rem', 
      '9xl': '8rem', 
    },
  }
})