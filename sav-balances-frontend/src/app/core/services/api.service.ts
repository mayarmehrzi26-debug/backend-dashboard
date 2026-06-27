// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient,HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction, StatutPaiement } from '../../models/transaction.model';

export interface Client {
  id?: number;
  societe: string;
  responsable: string;
  telephone: string;
  adresse: string;
  email: string;
  notes?: string;
  comportement?: string;
  note?: number;
  statutPaiement?: string;
  negociateur?: boolean;
  clientFidele?: boolean;
  nombreAvertissements?: number;
  dernierContact?: string;
  historiqueNotes?: string;
}

export interface Intervention {
  id?: number;
  numeroOrdre: string;
  societe: string;
  bascule: string;
  reference?: string;
  responsable: string;
  adresse: string;
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
  type?: string;
  statutIntervention?: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';
  prixPropose?: number;
  dateDiagnostic?: string;
  dateRecuperation?: string;
  montantTotal?: number;
  montantPaye?: number;
  montantRestant?: number;
  statutPaiement?: StatutPaiement | string;
}

export interface Balance {
  id?: number;
  reference: string;
  prix: number;
  categorie?: string;
  dateCreation: string;
  description: string;
  notes?: string;
}

export interface TransactionClient {
  id?: number;
  clientId?: number;
  interventionId?: number;
  montant: number;
  dateTransaction: string;
  methode: 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE';
  reference?: string;
  notes?: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'ANNULE';
  remise?: number;
  remisePourcentage?: number;
  promoCode?: string;
    numeroOrdreIntervention?: string;   // ✅ AJOUT

}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Clients
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/clients`);
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, client);
  }

  updateClient(id: number, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/${id}`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`);
  }

  patchClient(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/clients/${id}`, client);
  }

  // Interventions
  getInterventions(): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${this.apiUrl}/interventions`);
  }

  getIntervention(id: number): Observable<Intervention> {
    return this.http.get<Intervention>(`${this.apiUrl}/interventions/${id}`);
  }

  createIntervention(intervention: Intervention): Observable<Intervention> {
    return this.http.post<Intervention>(`${this.apiUrl}/interventions`, intervention);
  }

  updateIntervention(id: number, intervention: Intervention): Observable<Intervention> {
    return this.http.put<Intervention>(`${this.apiUrl}/interventions/${id}`, intervention);
  }

  deleteIntervention(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/interventions/${id}`);
  }

  getInterventionsByType(type: string): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${this.apiUrl}/interventions/type/${type}`);
  }

  // Balances
  getBalances(): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${this.apiUrl}/balances`);
  }

  createBalance(balance: Balance): Observable<Balance> {
    return this.http.post<Balance>(`${this.apiUrl}/balances`, balance);
  }

  updateBalance(id: number, balance: Balance): Observable<Balance> {
    return this.http.put<Balance>(`${this.apiUrl}/balances/${id}`, balance);
  }

  deleteBalance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/balances/${id}`);
  }

  // Stats
  getGlobalStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/global`);
  }

  getClientStats(clientId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/client/${clientId}`);
  }

  // Export PDF
  exportFormulairePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/formulaire/${id}/pdf`, { responseType: 'blob' });
  }

  exportFormulaireInternePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/interne/${id}/pdf`, { responseType: 'blob' });
  }

  exportBonRecuperationPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/interne/${id}/recuperation`, { responseType: 'blob' });
  }

  // Transactions
  getTransactionsByIntervention(interventionId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions/intervention/${interventionId}`);
  }

  ajouterPaiement(interventionId: number, transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions/intervention/${interventionId}`, transaction);
  }

  annulerTransaction(transactionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${transactionId}`);
  }

  // Wallet client
  getTransactionsByClientSociete(societe: string): Observable<TransactionClient[]> {
    return this.http.get<TransactionClient[]>(
      `${this.apiUrl}/transactions/client/${encodeURIComponent(societe)}`
    );
  }

  // Autres
  searchClients(keyword: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/clients/search?keyword=${keyword}`);
  }
  refreshIntervention(id: number): Observable<Intervention> {
    return this.http.post<Intervention>(`${this.apiUrl}/interventions/${id}/refresh`, {});
}
getInterventionsByClient(societe: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/interventions/client/${encodeURIComponent(societe)}`);
}
ajouterPaiementAuto(interventionId: number): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/transactions/intervention/${interventionId}/auto`, {});
}
  /**
   * Met à jour la date d'intervention avec paiement automatique
   * Utilise HttpParams pour éviter les problèmes de Content-Type
   */
  updateInterventionDate(interventionId: number, dateOrdre: string): Observable<Intervention> {
    const params = new HttpParams().set('dateOrdre', dateOrdre);
    
    return this.http.post<Intervention>(
      `${this.apiUrl}/transactions/intervention/${interventionId}/date`,
      null,
      { params }
    );
  }

  /**
   * Met à jour le prix estimé d'une intervention
   */
  updateInterventionPrix(interventionId: number, prixEstime: number): Observable<Intervention> {
    return this.http.post<Intervention>(
      `${this.apiUrl}/interventions/${interventionId}/prix`,
      prixEstime
    );
  }

}