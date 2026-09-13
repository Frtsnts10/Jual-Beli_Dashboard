/* eslint-disable @typescript-eslint/no-require-imports */
const { heroui } = require("@heroui/theme");

module.exports = heroui({
  themes: {
    light: {
      colors: {
        primary: {
          DEFAULT: "#2952cc",
          foreground: "#ffffff",
        },
      },
    },
    dark: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
      },
    },
  },
  layout: {
    radius: {
      small: "0.25rem",
      medium: "0.375rem",
      large: "0.5rem",
    },
  },
});
