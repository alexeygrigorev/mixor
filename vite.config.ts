import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function publicBase(): string {
  const raw = process.env.BASE_URL ?? "/";
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export default defineConfig({
  base: publicBase(),
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
