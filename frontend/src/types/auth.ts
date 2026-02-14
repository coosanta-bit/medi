export interface AuthUser {
  id: string;
  type: "PERSON" | "COMPANY";
  email: string;
  role: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export type UserRole =
  | "GUEST"
  | "PERSON"
  | "COMPANY_UNVERIFIED"
  | "COMPANY_VERIFIED"
  | "ADMIN"
  | "CS"
  | "SALES";
