/**
 * 시간 포맷 유틸리티 함수들
 */

// ===== 시간 관련 유틸리티 함수 =====

/**
 * 두 날짜 간의 시간 차이를 계산
 * @param targetDate - 대상 날짜
 * @param now - 현재 날짜 (기본값: new Date())
 * @returns 시간 차이 객체
 */
function calculateTimeDifference(targetDate: Date, now: Date = new Date()) {
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  const yearDiff = now.getFullYear() - targetDate.getFullYear();

  return {
    diffMs,
    diffMinutes,
    diffHours,
    diffDays,
    diffWeeks,
    diffMonths,
    diffYears,
    yearDiff,
  };
}

/**
 * 상대적 시간 표시 (예: "3분 전", "1시간 전")
 * @param date - 날짜 문자열 또는 Date 객체
 * @param now - 현재 시간 (기본값: new Date())
 * @returns 상대적 시간 문자열
 */
export function formatTimeAgo(
  date: string | Date,
  now: Date = new Date()
): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const { diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, diffYears } =
    calculateTimeDifference(targetDate, now);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffWeeks < 4) return `${diffWeeks}주 전`;
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  return `${diffYears}년 전`;
}

/**
 * 홈 화면용 상대적 시간 표시 (예: "3분 전", "1시간 전", "01.15")
 * @param dateStr - 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function formatTimeAgoForHome(dateStr: string | null): string {
  if (!dateStr) return "질문 없음";

  const targetDate = new Date(dateStr);
  const { diffMinutes, diffHours, diffDays, yearDiff } =
    calculateTimeDifference(targetDate);

  if (diffMinutes < 1) return "조금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays <= 30) return `${diffDays}일 전`;

  // 년도가 다르면 년도 포함, 같으면 월.일만 표시
  if (yearDiff < 1) {
    return `${(targetDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}.${targetDate.getDate().toString().padStart(2, "0")}`;
  }

  return `${targetDate.getFullYear()}.${(targetDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${targetDate.getDate().toString().padStart(2, "0")}`;
}

/**
 * 소요시간 포맷팅 (분/초 우선순위)
 * - durationSeconds가 있으면 "N초" (앱 기준)
 * - durationMinutes가 있으면 "N분"
 * - 둘 다 없으면 "N초"
 */
export function formatDuration(params: {
  durationMinutes?: number | null;
  durationSeconds?: number | null;
}): string {
  const seconds = params.durationSeconds;
  if (typeof seconds === "number" && !Number.isNaN(seconds) && seconds > 0) {
    return `${seconds}초`;
  }

  const minutes = params.durationMinutes;
  if (typeof minutes === "number" && !Number.isNaN(minutes) && minutes > 0) {
    return `${minutes}분`;
  }

  return "N초";
}
