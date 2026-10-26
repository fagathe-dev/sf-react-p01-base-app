import { RoleEnum } from '@/types/auth.types';

/** Libellés alignés sur RoleEnum::mapRole() côté API */
export const ROLE_LABELS: Record<RoleEnum, string> = {
  ROLE_USER: 'Utilisateur',
  ROLE_ADMIN: 'Administrateur',
};

/** Rôle le plus élevé de l'utilisateur (ROLE_ADMIN hérite de ROLE_USER) */
export const getPrimaryRole = (roles: RoleEnum[] | null | undefined): RoleEnum =>
  roles?.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : 'ROLE_USER';

export const getRoleLabel = (roles: RoleEnum[] | null | undefined): string => ROLE_LABELS[getPrimaryRole(roles)];
