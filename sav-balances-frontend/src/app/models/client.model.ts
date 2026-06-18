export interface Client {
  id?: number;
  societe: string;
  responsable: string;
  telephone: string;
  adresse: string;
  email: string;
  
  // ===== NOUVEAUX CHAMPS POUR LA NOTATION =====
  notes?: string;                    // Notes générales sur le client
  comportement?: string;              // PROFESSIONNEL, DIFFICILE, IMPOLI, EXCELLENT, A_EVITER
  note?: number;                      // Note de 1 à 5 étoiles
  statutPaiement?: string;            // PONCTUEL, RETARD_OCCASIONNEL, RETARD_FREQUENT, TRES_RETARD
  negociateur?: boolean;              // true = négocie beaucoup, false = normal
  clientFidele?: boolean;             // true = client fidèle
  nombreAvertissements?: number;      // Nombre d'avertissements
  dernierContact?: string;            // Date du dernier contact
  historiqueNotes?: string;           // Historique des notes (format JSON ou texte)
}