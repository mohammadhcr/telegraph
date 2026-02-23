export {};

export type Roles = "admin" | "member" | null;

declare global {
  interface CustomSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}

