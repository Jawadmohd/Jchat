export interface AuthUser {
  id: string;
  emailId: string;
  username: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
