// 비속어 필터링 유틸리티

// 확실한 비속어 목록 (오탐 최소화)
const PROFANITY_WORDS = [
  // 명확한 욕설
  "씨발",
  "개새끼",
  "지랄",
  "병신",
  "꺼져",
  "닥쳐",
  "좆",
  "씨팔",
  "씨발놈",
  "씨발새끼",

  // 성적 표현
  "섹스",
  "야동",
  "포르노",
  "자위",
  "성기",

  // 폭력적 표현
  "죽여",
  "때려죽여",
  "패죽여",

  // 영문 욕설
  "fuck",
  "shit",
  "bitch",
  "damn",
  "hell",
  "ass",
  "crap",
  "stupid",
  "idiot",
  "moron",
  "retard",

  // 자음 조합 우회
  "ㅅㅂ",
  "ㅈㄹ",
  "ㅂㅅ",
  "ㅁㅊ",
  "ㅇㅈ",
  "ㄱㅅ",
];

// 정규화 함수 (특수문자, 공백 제거, 소문자 변환)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w가-힣]/g, "") // 특수문자 제거
    .replace(/\s+/g, ""); // 공백 제거
}

// 비속어 검사 함수 (한글에 맞는 정확한 매칭)
export function containsProfanity(text: string): boolean {
  if (!text || text.length === 0) return false;

  return PROFANITY_WORDS.some((word) => {
    // 한글과 영문 모두에 적용되는 정확한 단어 매칭
    // 단어 앞뒤로 공백, 특수문자, 문장 끝 등이 오는 경우만 매칭
    const wordRegex = new RegExp(`(^|[\\s\\W])${word}([\\s\\W]|$)`, "i");
    return wordRegex.test(text);
  });
}

// 비속어 마스킹 함수
export function maskProfanity(text: string): string {
  if (!text) return text;

  let maskedText = text;
  PROFANITY_WORDS.forEach((word) => {
    const regex = new RegExp(word, "gi");
    maskedText = maskedText.replace(regex, "*".repeat(word.length));
  });

  return maskedText;
}

// 비속어 필터링된 텍스트 반환
export function filterProfanity(text: string): {
  hasProfanity: boolean;
  filteredText: string;
  originalText: string;
} {
  const hasProfanity = containsProfanity(text);
  const filteredText = hasProfanity ? maskProfanity(text) : text;

  return {
    hasProfanity,
    filteredText,
    originalText: text,
  };
}

// 경고 메시지 생성
export function getProfanityWarningMessage(): string {
  return "부적절한 표현이 포함되어 있습니다. 다시 작성해주세요.";
}
