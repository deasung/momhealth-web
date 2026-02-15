export type NavItem = {
  label: string;
  path: string;
  children?: Array<{ label: string; path: string }>;
};
