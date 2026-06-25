// src/app/core/services/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('📱 ProfileService - apiUrl:', this.apiUrl);
  }

  getProfile(username: string): Observable<User> {
    console.log(`📱 getProfile - Appel à: ${this.apiUrl}/profile/${username}`);
    return this.http.get<User>(`${this.apiUrl}/profile/${username}`);
  }

  updateProfile(username: string, user: Partial<User>): Observable<User> {
    console.log(`📱 updateProfile - Appel à: ${this.apiUrl}/profile/${username}`);
    return this.http.put<User>(`${this.apiUrl}/profile/${username}`, user);
  }

  changePassword(username: string, oldPassword: string, newPassword: string): Observable<any> {
    console.log(`📱 changePassword - Appel à: ${this.apiUrl}/profile/${username}/change-password`);
    return this.http.post(`${this.apiUrl}/profile/${username}/change-password`, {
      oldPassword,
      newPassword
    });
  }

  updateTelephone(username: string, telephone: string): Observable<User> {
    console.log(`📱 updateTelephone - Appel à: ${this.apiUrl}/profile/${username}/telephone`);
    return this.http.patch<User>(`${this.apiUrl}/profile/${username}/telephone`, { telephone });
  }
}