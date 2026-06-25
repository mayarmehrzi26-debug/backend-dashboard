import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: User): Observable<User> {
    // S'assurer que le téléphone est bien inclus
    console.log('📞 Envoi du téléphone:', user.telephone);
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    // S'assurer que le téléphone est bien inclus
    console.log('📞 Mise à jour du téléphone:', user.telephone);
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  toggleUserEnabled(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/toggle`, {});
  }

  getTechniciens(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/techniciens`);
  }

  getTechniciensActifs(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/techniciens/actifs`);
  }
}