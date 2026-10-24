/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // All colors reference CSS custom properties so themes can swap them at runtime.
        // The actual values are defined in src/index.css under [data-tema="..."] selectors.

        // --- SURFACE ---
        surface:                      "var(--color-surface)",
        "surface-dim":                "var(--color-surface-dim)",
        "surface-bright":             "var(--color-surface-bright)",
        "surface-container-lowest":   "var(--color-surface-container-lowest)",
        "surface-container-low":      "var(--color-surface-container-low)",
        "surface-container":          "var(--color-surface-container)",
        "surface-container-high":     "var(--color-surface-container-high)",
        "surface-container-highest":  "var(--color-surface-container-highest)",
        "surface-variant":            "var(--color-surface-variant)",
        "on-surface":                 "var(--color-on-surface)",
        "on-surface-variant":         "var(--color-on-surface-variant)",
        "inverse-surface":            "var(--color-inverse-surface)",
        "inverse-on-surface":         "var(--color-inverse-on-surface)",
        "surface-tint":               "var(--color-surface-tint)",

        // --- OUTLINE ---
        outline:                      "var(--color-outline)",
        "outline-variant":            "var(--color-outline-variant)",

        // --- PRIMARY ---
        primary:                      "var(--color-primary)",
        "on-primary":                 "var(--color-on-primary)",
        "primary-container":          "var(--color-primary-container)",
        "on-primary-container":       "var(--color-on-primary-container)",
        "inverse-primary":            "var(--color-inverse-primary)",

        // --- SECONDARY ---
        secondary:                    "var(--color-secondary)",
        "on-secondary":               "var(--color-on-secondary)",
        "secondary-container":        "var(--color-secondary-container)",
        "on-secondary-container":     "var(--color-on-secondary-container)",

        // --- TERTIARY ---
        tertiary:                     "var(--color-tertiary)",
        "on-tertiary":                "var(--color-on-tertiary)",
        "tertiary-container":         "var(--color-tertiary-container)",
        "on-tertiary-container":      "var(--color-on-tertiary-container)",

        // --- ERROR ---
        error:                        "var(--color-error)",
        "on-error":                   "var(--color-on-error)",
        "error-container":            "var(--color-error-container)",
        "on-error-container":         "var(--color-on-error-container)",

        // --- BACKGROUND ---
        background:                   "var(--color-background)",
        "on-background":              "var(--color-on-background)",

        // --- SIDEBAR ---
        sidebar:                      "var(--color-sidebar)",
        "on-sidebar":                 "var(--color-on-sidebar)",

        // --- ESPECÍFICOS ---
        "grid-container":             "var(--color-grid-container)",
      },
      fontFamily: {
        "sans": ["'DM Sans'", "sans-serif"],
        "dm-sans": ["'DM Sans'", "sans-serif"],
        "playfair": ["'DM Sans'", "sans-serif"],
      },
      fontSize: {
        "headline-lg":        ["40px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg-mobile": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md":        ["28px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-sm":        ["22px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg":            ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md":            ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm":            ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-md":           ["14px", { lineHeight: "1.2", fontWeight: "500" }],
        "label-sm":           ["12px", { lineHeight: "1.2", fontWeight: "500" }],
      },
      borderRadius: {
        sm:      "0.25rem",
        DEFAULT: "0.5rem",
        md:      "0.75rem",
        lg:      "1rem",
        xl:      "1.5rem",
        full:    "9999px",
      },
      spacing: {
        unit: "0.5rem",
      },
    },
  },
  plugins: [],
};
