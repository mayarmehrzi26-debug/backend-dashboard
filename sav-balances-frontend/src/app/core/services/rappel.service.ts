import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RappelPoinconnage {
  id?: number;
  interventionId?: number;
  numeroOrdre: string;
  societe: string;
  equipement: string;
  reference: string;
  responsable: string;
  telephone: string;
  email: string;
  dateDernierPoinconnage: string;
  dateProchainPoinconnage: string;
  joursRestants: number;
  statut: 'ACTIF' | 'EN_COURS' | 'EXPIRE' | 'TRAITE';
  notifie: boolean;
  dateCreation: string;
  dateNotification?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RappelService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRappelsImminents(): Observable<RappelPoinconnage[]> {
    return this.http.get<any>(`${this.apiUrl}/rappels/imminents`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        return response || [];
      })
    );
  }

  getRappelsActifs(): Observable<RappelPoinconnage[]> {
    return this.http.get<any>(`${this.apiUrl}/rappels/actifs`).pipe(
      map(response => {
        console.log('📋 getRappelsActifs - Réponse brute:', response);
        if (response && response.success && response.data) {
          console.log('📋 getRappelsActifs - Data extraite:', response.data);
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      })
    );
  }

  getRappelsExpires(): Observable<RappelPoinconnage[]> {
    return this.http.get<any>(`${this.apiUrl}/rappels/expires`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        return response || [];
      })
    );
  }

  getRappelsANotifier(): Observable<RappelPoinconnage[]> {
    return this.http.get<any>(`${this.apiUrl}/rappels/notifier`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        return response || [];
      })
    );
  }

  getRappelsByClient(societe: string): Observable<RappelPoinconnage[]> {
    return this.http.get<any>(`${this.apiUrl}/rappels/client/${encodeURIComponent(societe)}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        return response || [];
      })
    );
  }

  creerRappel(interventionId: number): Observable<RappelPoinconnage> {
    return this.http.post<RappelPoinconnage>(`${this.apiUrl}/rappels/intervention/${interventionId}`, {});
  }

  genererTousLesRappels(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rappels/generer`, {});
  }

  marquerNotifie(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rappels/${id}/notifie`, {});
  }
}