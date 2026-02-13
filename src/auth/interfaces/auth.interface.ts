export interface JwtPayload {
  name: string;
  iat?: number;
  exp?: number;
}
