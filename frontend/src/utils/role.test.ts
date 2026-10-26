import { describe, expect, it } from 'vitest';
import { getPrimaryRole, getRoleLabel } from './role';

describe('getPrimaryRole', () => {
  it.each([null, undefined, []])('retourne ROLE_USER par défaut pour %p', (roles) => {
    expect(getPrimaryRole(roles)).toBe('ROLE_USER');
  });

  it('retourne ROLE_ADMIN dès que le rôle est présent', () => {
    expect(getPrimaryRole(['ROLE_USER', 'ROLE_ADMIN'])).toBe('ROLE_ADMIN');
  });
});

describe('getRoleLabel', () => {
  it('retourne le libellé du rôle le plus élevé', () => {
    expect(getRoleLabel(['ROLE_USER'])).toBe('Utilisateur');
    expect(getRoleLabel(['ROLE_ADMIN', 'ROLE_USER'])).toBe('Administrateur');
  });
});
