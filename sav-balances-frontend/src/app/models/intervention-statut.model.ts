export type StatutIntervention = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

export const STATUT_INTERVENTION_LABELS: Record<StatutIntervention, string> = {
  'EN_ATTENTE': '🔵 En attente',
  'CONFIRME': '🟡 Confirmé',
  'ANNULE': '🔴 Annulé',
  'TERMINE': '🟢 Terminé'
};

export const STATUT_INTERVENTION_CLASSES: Record<StatutIntervention, string> = {
  'EN_ATTENTE': 'badge-secondary',
  'CONFIRME': 'badge-warning',
  'ANNULE': 'badge-danger',
  'TERMINE': 'badge-success'
};

export function getStatutInterventionLabel(statut?: StatutIntervention | string): string {
  if (!statut) return 'Non défini';
  return STATUT_INTERVENTION_LABELS[statut as StatutIntervention] || statut;
}

export function getStatutInterventionClass(statut?: StatutIntervention | string): string {
  if (!statut) return 'badge-secondary';
  return STATUT_INTERVENTION_CLASSES[statut as StatutIntervention] || 'badge-secondary';
}
