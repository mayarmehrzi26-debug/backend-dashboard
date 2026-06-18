import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Prestation } from '../../models/prestation.model';

@Injectable({
  providedIn: 'root'
})
export class PrestationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPrestations(): Observable<Prestation[]> {
    return this.http.get<Prestation[]>(`${this.apiUrl}/prestations/active`);
  }

  getAllPrestations(): Observable<Prestation[]> {
    return this.http.get<Prestation[]>(`${this.apiUrl}/prestations`);
  }

  getPrestation(id: number): Observable<Prestation> {
    return this.http.get<Prestation>(`${this.apiUrl}/prestations/${id}`);
  }

  createPrestation(prestation: Prestation): Observable<Prestation> {
    return this.http.post<Prestation>(`${this.apiUrl}/prestations`, prestation);
  }

  updatePrestation(id: number, prestation: Prestation): Observable<Prestation> {
    return this.http.put<Prestation>(`${this.apiUrl}/prestations/${id}`, prestation);
  }

  deletePrestation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/prestations/${id}`);
  }
}