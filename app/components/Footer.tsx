// ✅ Server Component: 정적 UI만 포함, 인터랙션 없음
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 상단: 로고 및 네비게이션 링크 */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-8">
            {/* 로고 */}
            <div className="mb-4 md:mb-0">
              <Link
                href="/"
                className="inline-block font-bold text-xl md:text-2xl text-gray-900 hover:text-orange-500 transition-colors"
              >
                오늘의 건강
              </Link>
            </div>

            {/* 네비게이션 링크 */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
              <Link
                href="/my/terms/service"
                className="hover:text-gray-900 transition-colors"
              >
                이용약관
              </Link>
              <Link
                href="/my/terms/privacy"
                className="hover:text-gray-900 transition-colors"
              >
                개인정보 처리방침
              </Link>
            </div>
          </div>
        </div>

        {/* 중간: 회사 정보 */}
        <div className="border-t border-gray-100 pt-6 md:pt-8 mb-6 md:mb-8">
          <div className="text-xs text-gray-500 leading-relaxed">
            <p className="break-keep">
              상호명: 참치컴퍼니 | 대표: 최재현 | 개인정보책임자: 최재현
            </p>
          </div>
        </div>

        {/* 하단: 저작권 및 앱 다운로드 */}
        <div className="border-t border-gray-100 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 저작권 */}
            <div className="text-xs text-gray-400">
              <p>© 2026 medigen.ai.</p>
            </div>

            {/* 앱 다운로드 링크 */}
            <div>
              <a
                href="https://play.google.com/store/apps/details?id=com.gimmihui68.momhealthapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm text-gray-700"
                aria-label="Google Play Store에서 앱 다운로드"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">앱 다운로드</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
