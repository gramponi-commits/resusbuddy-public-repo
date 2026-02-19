import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // PALS Clinical Colors
        pals: {
          primary: "hsl(var(--pals-primary))",
          "primary-foreground": "hsl(var(--pals-primary-foreground))",
        },
        acls: {
          adult: "hsl(var(--acls-primary))",
          "adult-foreground": "hsl(var(--acls-primary-foreground))",
          pediatric: "hsl(var(--pals-primary))",
          "pediatric-foreground": "hsl(var(--pals-primary-foreground))",
          shockable: "hsl(var(--acls-shockable))",
          "shockable-foreground": "hsl(var(--acls-shockable-foreground))",
          "non-shockable": "hsl(var(--acls-non-shockable))",
          "non-shockable-foreground": "hsl(var(--acls-non-shockable-foreground))",
          pea: "hsl(var(--acls-pea))",
          "pea-foreground": "hsl(var(--acls-pea-foreground))",
          success: "hsl(var(--acls-success))",
          "success-foreground": "hsl(var(--acls-success-foreground))",
          warning: "hsl(var(--acls-warning))",
          "warning-foreground": "hsl(var(--acls-warning-foreground))",
          critical: "hsl(var(--acls-critical))",
          "critical-foreground": "hsl(var(--acls-critical-foreground))",
          info: "hsl(var(--acls-info))",
          "info-foreground": "hsl(var(--acls-info-foreground))",
          medication: "hsl(var(--acls-medication))",
          "medication-foreground": "hsl(var(--acls-medication-foreground))",
          bradycardia: "hsl(var(--acls-bradycardia))",
          "bradycardia-foreground": "hsl(var(--acls-bradycardia-foreground))",
          tachycardia: "hsl(var(--acls-tachycardia))",
          "tachycardia-foreground": "hsl(var(--acls-tachycardia-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
