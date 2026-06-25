// src/app/core/constants/statut.constants.ts
export const STATUTS = {
  INTERVENTION: {
    EN_ATTENTE: 'EN_ATTENTE',
    CONFIRME: 'CONFIRME',
    TERMINE: 'TERMINE',
    ANNULE: 'ANNULE'
  },
  PAIEMENT: {
    EN_ATTENTE: 'EN_ATTENTE',
    PARTIEL: 'PARTIEL',
    PAYE: 'PAYE',
    EN_RETARD: 'EN_RETARD',
    ANNULE: 'ANNULE'
  }
} as const;

export const STATUT_LABELS = {
  INTERVENTION: {
    'EN_ATTENTE': '🔵 En attente',
    'CONFIRME': '🟡 En cours',
    'TERMINE': '🟢 Terminé',
    'ANNULE': '🔴 Annulé'
  },
  PAIEMENT: {
    'EN_ATTENTE': '⏳ En attente',
    'PARTIEL': '🟡 Partiel',
    'PAYE': '✅ Payé',
    'EN_RETARD': '⚠️ En retard',
    'ANNULE': '❌ Annulé'
  }
} as const;

export const STATUT_COLORS = {
  INTERVENTION: {
    'EN_ATTENTE': '#17a2b8',   // Bleu
    'CONFIRME': '#ffc107',     // Jaune
    'TERMINE': '#28a745',      // Vert
    'ANNULE': '#dc3545'        // Rouge
  },
  PAIEMENT: {
    'EN_ATTENTE': '#6c757d',   // Gris
    'PARTIEL': '#ffc107',      // Jaune
    'PAYE': '#28a745',         // Vert
    'EN_RETARD': '#dc3545',    // Rouge
    'ANNULE': '#dc3545'        // Rouge
  }
} as const;

export const STATUT_CLASSES = {
  INTERVENTION: {
    'EN_ATTENTE': 'badge-info',
    'CONFIRME': 'badge-warning',
    'TERMINE': 'badge-success',
    'ANNULE': 'badge-danger'
  },
  PAIEMENT: {
    'EN_ATTENTE': 'badge-secondary',
    'PARTIEL': 'badge-warning',
    'PAYE': 'badge-success',
    'EN_RETARD': 'badge-danger',
    'ANNULE': 'badge-danger'
  }
} as const;

export function getStatutLabel(type: 'INTERVENTION' | 'PAIEMENT', statut?: string): string {
  if (!statut) return 'Non défini';
  const labels = type === 'INTERVENTION' ? STATUT_LABELS.INTERVENTION : STATUT_LABELS.PAIEMENT;
  return labels[statut as keyof typeof labels] || statut;
}

export function getStatutColor(type: 'INTERVENTION' | 'PAIEMENT', statut?: string): string {
  if (!statut) return '#6c757d';
  const colors = type === 'INTERVENTION' ? STATUT_COLORS.INTERVENTION : STATUT_COLORS.PAIEMENT;
  return colors[statut as keyof typeof colors] || '#6c757d';
}

export function getStatutClass(type: 'INTERVENTION' | 'PAIEMENT', statut?: string): string {
  if (!statut) return 'badge-secondary';
  const classes = type === 'INTERVENTION' ? STATUT_CLASSES.INTERVENTION : STATUT_CLASSES.PAIEMENT;
  return classes[statut as keyof typeof classes] || 'badge-secondary';
}