/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只在明确设置环境变量 STANDALONE=true 时启用 standalone 输出。
  // Windows 下 Next.js 14.x 的 standalone 构建存在 ENOENT 问题，
  // 而 Docker 和 SEA 构建依赖此模式（这些构建通常在 Linux 上运行，不受影响）。
  output: process.env.STANDALONE === "true" ? "standalone" : undefined,
  experimental: {
    // 禁用 webpack 构建 worker（Windows 上默认开启），解决子进程写入
    // pages-manifest.json 后主进程读取不到文件的 ENOENT 问题。
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
