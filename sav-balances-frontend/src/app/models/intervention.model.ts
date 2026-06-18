export interface Intervention {
  id?: number;
  numeroOrdre: string;
  societe: string;
  bascule: string;
  responsable: string;
  adresse: string;
   reference?: string;
  telephone: string;
  email: string;
  reclamation: string;
  technicien: string;
  dateReclamation: string;
  dateOrdre: string;
  rapportIntervention: string;
  prixEstime?: number;
  prixReel?: number;
  prestationId?: number;
  type?: string;  // ← AJOUTER CETTE LIGNE
}