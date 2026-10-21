
import type { NextConfig } from "next";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserPage =
  process.env.GITHUB_REPOSITORY === `${process.env.GITHUB_ACTOR ?? ""}.github.io` ||
  process.env.GITHUB_REPOSITORY?.endsWith(".github.io");
const basePath = process.env.BASE_PATH || (repoName && !isUserPage ? `/${repoName}` : "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
