export type RoleEnum = 'ROLE_USER' | 'ROLE_ADMIN';

export interface User {
  id: string;
  email: string;
  roles: RoleEnum[];
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  avatar?: string | null;
  isVerified?: boolean;
  hasJournalPasscode?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginCodeRequestResponse extends MessageResponse {
  /** Validité du code, en secondes */
  expiresIn: number;
  /** Délai avant de pouvoir redemander un code, en secondes */
  resendAvailable: number;
}

/** Réponse de POST /account/delete-request (même forme que la demande de code de connexion) */
export type AccountDeletionRequestResponse = LoginCodeRequestResponse;

export interface LoginCodePayload {
  username: string;
  code: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface UpdateProfilePayload {
  username: string;
  firstname?: string | null;
  lastname?: string | null;
}

export interface ChangeEmailPayload {
  email: string;
}

export interface ConfirmEmailChangeResponse {
  user: User;
  message: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SetJournalPasscodePayload {
  currentPasscode?: string;
  passcode: string;
}

export interface SetJournalPasscodeResponse {
  user: User;
  message: string;
}
