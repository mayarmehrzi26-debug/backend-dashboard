// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  fullName: string;
  message: string;
}

export interface User {
  username: string;
  password: string;
  email: string;
  role?: string;
  fullName?: string;
}

// Types de rôles disponibles
export type UserRole = 'ADMIN' | 'TECHNICIEN' | 'USER';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('username', response.username);
            localStorage.setItem('role', response.role);
            localStorage.setItem('fullName', response.fullName);
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(this.getCurrentUser());
            console.log('✅ Connexion réussie - Rôle:', response.role);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Erreur login:', error);
          
          let errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
          
          if (error.error && typeof error.error === 'object') {
            if (error.error.message) {
              errorMessage = error.error.message;
            }
          } else if (error.status === 0) {
            errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Nom d\'utilisateur ou mot de passe incorrect';
          } else if (error.status === 401) {
            errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }
          
          return throwError(() => ({ 
            status: error.status, 
            message: errorMessage,
            error: error.error 
          }));
        })
      );
  }

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('rememberMe');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    console.log('👋 Déconnexion effectuée');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): { username: string; role: string; fullName: string } | null {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    if (username && role && fullName) {
      return { username, role, fullName };
    }
    return null;
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  // ===== MÉTHODES DE VÉRIFICATION DES RÔLES =====
  
  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isTechnicien(): boolean {
    return this.getRole() === 'TECHNICIEN';
  }

  isUser(): boolean {
    return this.getRole() === 'USER';
  }

  // ===== MÉTHODE POUR VÉRIFIER SI L'UTILISATEUR A UN RÔLE SPÉCIFIQUE =====
  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }

  // ===== MÉTHODE POUR OBTENIR LE LIBELLÉ DU RÔLE =====
  getRoleLabel(): string {
    const role = this.getRole();
    const labels: {[key: string]: string} = {
      'ADMIN': '👑 Administrateur',
      'TECHNICIEN': '🔧 Technicien',
      'USER': '👤 Utilisateur'
    };
    return labels[role || ''] || 'Utilisateur';
  }

  // ===== MÉTHODE POUR VÉRIFIER SI L'UTILISATEUR PEUT ÉDITER =====
  canEdit(): boolean {
    return this.isAdmin();
  }

  // ===== MÉTHODE POUR VÉRIFIER SI L'UTILISATEUR PEUT VOIR TOUT =====
  canViewAll(): boolean {
    return this.isAdmin() || this.isUser();
  }

  // ===== MÉTHODE POUR VÉRIFIER SI L'UTILISATEUR EST UN TECHNICIEN ASSIGNÉ =====
  isTechnicienAssigne(technicienNom: string): boolean {
    if (!this.isTechnicien()) return false;
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    return currentUser.fullName === technicienNom || currentUser.username === technicienNom;
  }
    // ===== NOUVELLE MÉTHODE: Rafraîchir les données de l'utilisateur connecté =====
  refreshCurrentUser(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      // Recharger les données depuis le localStorage
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');
      const fullName = localStorage.getItem('fullName');
      
      if (username && role && fullName) {
        this.currentUserSubject.next({ username, role, fullName });
      }
    }
  
}
}