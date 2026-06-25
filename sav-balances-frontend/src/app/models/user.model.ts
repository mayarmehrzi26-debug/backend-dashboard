// src/app/models/user.model.ts
export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIEN' | 'USER';
  fullName: string;
  enabled: boolean;
  telephone?: string; 
  lastLogin?: string;
  createdAt?: string;
}

// Rôles disponibles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIEN: 'TECHNICIEN',
  USER: 'USER'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Helper pour vérifier le rôle
export function isTechnicien(user: User): boolean {
  return user.role === USER_ROLES.TECHNICIEN;
}

export function isAdmin(user: User): boolean {
  return user.role === USER_ROLES.ADMIN;
}

export function isUser(user: User): boolean {
  return user.role === USER_ROLES.USER;
}

export function getRoleLabel(role: string): string {
  const labels: {[key: string]: string} = {
    'ADMIN': '👑 Administrateur',
    'TECHNICIEN': '🔧 Technicien',
    'USER': '👤 Utilisateur'
  };
  return labels[role] || role;
}

export function getRoleClass(role: string): string {
  const classes: {[key: string]: string} = {
    'ADMIN': 'badge-danger',
    'TECHNICIEN': 'badge-primary',
    'USER': 'badge-info'
  };
  return classes[role] || 'badge-secondary';
}