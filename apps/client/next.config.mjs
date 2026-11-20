import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  async rewrites() {
    const apiOrigin = process.env.PATRA_API_ORIGIN?.trim().replace(/\/+$/, "");
    if (!apiOrigin) {
      if (process.env.NEXT_PUBLIC_API_URL === "/api") {
        throw new Error("PATRA_API_ORIGIN is required when NEXT_PUBLIC_API_URL=/api");
      }
      return [];
    }

    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
