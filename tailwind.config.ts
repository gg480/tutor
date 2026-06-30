import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui 语义色（映射到 CSS 变量）
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
        // 拾步品牌色 — 全员大会品牌总监方案
        shibu: {
          50: "#f0f4fa",
          100: "#d9e3f2",
          200: "#b3c7e5",
          300: "#8dabd8",
          400: "#668fcb",
          500: "#2C5385", // 拾步蓝 - 主色
          600: "#23426a",
          700: "#1a324f",
          800: "#122135",
          900: "#09111a",
        },
        // 自信橙
        confidence: {
          50: "#fef5e7",
          100: "#fde3b8",
          200: "#fbd189",
          300: "#f9bf5a",
          400: "#f7ad2b",
          500: "#F68B1F", // 自信橙 - 强调色
          600: "#c56f19",
          700: "#945313",
          800: "#63380c",
          900: "#321c06",
        },
        // 暖白鼠尾
        warm: {
          50: "#F5F5F0", // 暖白鼠尾 - 背景色
          100: "#e8e8e0",
          200: "#d4d4c8",
          300: "#bfbfb0",
          400: "#abab98",
          500: "#969680",
          600: "#787866",
          700: "#5a5a4d",
          800: "#3c3c33",
          900: "#1e1e1a",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
