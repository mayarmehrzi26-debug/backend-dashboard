// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    // Ne pas ajouter le token pour les requêtes de login
    if (req.url.includes('/auth/login')) {
      // IMPORTANT: Ne pas intercepter les erreurs de login
      return next.handle(req);
    }
    
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur HTTP:', error.status, error.message);
        
        if (error.status === 401) {
          console.warn('⏰ Session expirée - Redirection vers login');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          console.warn('🚫 Accès interdit - Droits insuffisants');
        } else if (error.status === 0) {
          console.error('🌐 Erreur réseau - Serveur inaccessible');
        }
        
        return throwError(() => error);
      })
    );
  }
}