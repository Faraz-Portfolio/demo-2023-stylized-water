import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { repository } from "./package.json";

function getBaseFromRepo(repo: string): string {
  const match = repo.match(/github\.com\/[^/]+\/[^/]+/);
  return match ? `/${match[0].split("/").slice(2).join("/")}/` : "/";
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: getBaseFromRepo(repository.url),
});
