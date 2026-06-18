export interface Prestation {
  id?: number;
  code: string;
  nom: string;
  description: string;
  prixForfait?: number;
  prixHeure?: number;
  dureeEstimeeHeures?: number;
  actif: boolean;
  ordreAffichage: number;
}