import type { NextConfig } from "next";
import path from "path";

/**
 * 상위 폴더에 다른 lockfile이 있으면 Next가 잘못된 워크스페이스 루트를 잡아
 * 빌드 산출물이 비거나 404가 날 수 있음. 로컬·Vercel 모두 프로젝트 디렉터리로 고정.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
