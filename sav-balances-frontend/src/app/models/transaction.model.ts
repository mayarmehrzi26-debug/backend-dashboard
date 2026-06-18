// src/app/models/transaction.model.ts
import { Intervention } from '../core/services/api.service';

export type StatutPaiement = 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'EN_RETARD' | 'ANNULE';
export type StatutTransaction = 'EN_ATTENTE' | 'VALIDE' | 'ANNULE';
export type MethodePaiement = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE';

export interface Transaction {
  id?: number;
  interventionId?: number;
  montant: number;
  dateTransaction: string;
  methode: MethodePaiement;
  reference?: string;
  notes?: string;
  statut: StatutTransaction;
}

export interface InterventionPaiement extends Intervention {
  montantTotal?: number;
  montantPaye?: number;
  montantRestant?: number;
  statutPaiement?: StatutPaiement;
  dateEcheance?: string;
  transactions?: Transaction[];
}

// Helpers
export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  'EN_ATTENTE': 'En attente',
  'PARTIEL': 'Paiement partiel',
  'PAYE': 'Payé',
  'EN_RETARD': 'En retard',
  'ANNULE': 'Annulé'
};

export const STATUT_PAIEMENT_CLASSES: Record<StatutPaiement, string> = {
  'EN_ATTENTE': 'badge-secondary',
  'PARTIEL': 'badge-warning',
  'PAYE': 'badge-success',
  'EN_RETARD': 'badge-danger',
  'ANNULE': 'badge-dark'
};

export const METHODE_PAIEMENT_LABELS: Record<MethodePaiement, string> = {
  'ESPECES': '💰 Espèces',
  'CHEQUE': '📝 Chèque',
  'VIREMENT': '🏦 Virement',
  'CARTE': '💳 Carte'
};

export function getStatutLabel(statut?: StatutPaiement | string): string {
  if (!statut) return 'Non défini';
  return STATUT_PAIEMENT_LABELS[statut as StatutPaiement] || statut;
}

export function getStatutClass(statut?: StatutPaiement | string): string {
  if (!statut) return 'badge-secondary';
  return STATUT_PAIEMENT_CLASSES[statut as StatutPaiement] || 'badge-secondary';
}

export function getPaymentProgress(montantTotal?: number, montantPaye?: number): number {
  const total = montantTotal || 0;
  const paye = montantPaye || 0;
  if (total === 0) return 0;
  return Math.round((paye / total) * 100);
}

export function getMethodeLabel(methode?: MethodePaiement | string): string {
  if (!methode) return 'Non spécifiée';
  return METHODE_PAIEMENT_LABELS[methode as MethodePaiement] || methode;
}

export function calculateMontantRestant(montantTotal?: number, montantPaye?: number): number {
  const total = montantTotal || 0;
  const paye = montantPaye || 0;
  return Math.max(0, total - paye);
}

export function toStatutPaiement(value: string): StatutPaiement {
  const validStatuses: StatutPaiement[] = ['EN_ATTENTE', 'PARTIEL', 'PAYE', 'EN_RETARD', 'ANNULE'];
  return validStatuses.includes(value as StatutPaiement) 
    ? value as StatutPaiement 
    : 'EN_ATTENTE';
}