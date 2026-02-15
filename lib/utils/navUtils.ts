import { NavItem } from "@/app/types/navigation";

/**
 * 네비게이션 항목의 활성 상태를 판단하는 유틸리티 함수
 * @param pathname 현재 경로
 * @param item 네비게이션 항목
 * @param isClient 클라이언트 환경 여부
 * @returns 활성 상태 여부
 */
export function isNavItemActive(
  pathname: string,
  item: NavItem,
  isClient: boolean
): boolean {
  if (!isClient) return false;

  if (item.children) {
    return item.children.some(
      (child) =>
        pathname === child.path || pathname.startsWith(child.path + "/")
    );
  }

  if (item.path) {
    // 홈 페이지는 정확히 일치해야 함
    if (item.path === "/") {
      return pathname === "/";
    }
    return pathname === item.path || pathname.startsWith(item.path + "/");
  }

  return false;
}
