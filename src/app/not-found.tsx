import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-shibu-50 to-warm-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-shibu-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-sm text-gray-500 mb-8">
          您访问的页面不存在，或已被移动到其他位置。
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 transition"
          >
            返回工作台
          </Link>
          <Link
            href="/studio"
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            品牌主页
          </Link>
        </div>
      </div>
    </div>
  );
}
