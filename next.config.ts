import type { NextConfig } from "next";
import path from "path";

/**
 * 상위 디렉터리에 다른 lockfile이 있으면 Turbopack이 잘못된 루트를 잡아
 * "페이지를 불러올 수 없음" / 청크 404가 날 수 있어 프로젝트 폴더를 고정합니다.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
