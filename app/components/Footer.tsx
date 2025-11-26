"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      {/* 메인 푸터 콘텐츠 */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* 상단 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* 브랜드 섹션 */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-xl font-bold text-gray-900">오늘의 건강</h3>
            </Link>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              마음을 챙기는 습관,
              <br />
              오늘의 건강과 함께
              <br />
              만들어 보세요
            </p>
            {/* 앱 다운로드 배너 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                앱에서 더 많은 기능을 만나보세요
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  앱 다운로드
                </span>
              </div>
            </div>
          </div>

          {/* 건강질문 섹션 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              건강질문
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/health-questions/list"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  질문 목록
                </Link>
              </li>
            </ul>
          </div>

          {/* 커뮤니티 섹션 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              커뮤니티
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/community/list"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  커뮤니티 홈
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 섹션 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              고객지원
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/support/faq"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link
                  href="/support/contact"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  문의하기
                </Link>
              </li>
              <li>
                <Link
                  href="/support/privacy"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 섹션 */}
        <div className="border-t border-gray-100 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 회사 정보 */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>상호명: 오늘의 건강 | 대표: 최재현</p>
              {/*<p>사업장소재지: 서울특별시 강남구 테헤란로 123, 10층</p>*/}
              {/*<p>*/}
              {/*  사업자등록번호: 123-45-67890 | 통신판매업신고번호: 제*/}
              {/*  2024-서울강남-01234*/}
              {/*</p>*/}
              <p>개인정보책임자: 최재현</p>
            </div>

            {/* 연락처 정보 */}
            {/*<div className="text-xs text-gray-500 space-y-1">*/}
            {/*  <p>고객센터: 02-1234-5678</p>*/}
            {/*  <p>대표 메일: support@todayhealth.com</p>*/}
            {/*  <p>고객문의: 카카오톡 플러스친구 &apos;오늘의 건강&apos;</p>*/}
            {/*</div>*/}
          </div>

          {/* 긴급상담 안내 */}
          {/*<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">*/}
          {/*  <p className="text-xs text-yellow-800">*/}
          {/*    <span className="font-medium">긴급상담 안내:</span> 본인 또는*/}
          {/*    타인의 생명이 위급한 상황일 경우에는 24시간 상담 가능한 정신건강*/}
          {/*    위기상담전화 1577-0199 혹은 보건복지콜센터 129에 도움을*/}
          {/*    요청하십시오. 긴급 신고는 119 안전신고센터를 이용하시기 바랍니다.*/}
          {/*  </p>*/}
          {/*</div>*/}

          {/* 저작권 정보 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              © 2024 Today Health Company. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
