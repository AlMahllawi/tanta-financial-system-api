export interface AuthenticatedUser {
  name: string;
  role: string;
  departmentName: string;
}

export interface JwtPayload {
  name: string;
  role: string;
  department: string;
  iat?: number;
  exp?: number;
}
