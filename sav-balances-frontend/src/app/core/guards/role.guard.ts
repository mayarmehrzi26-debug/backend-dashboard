// src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  // Routes autorisées pour USER
  private readonly USER_ROUTES = [
    'dashboard',
    'clients',
    'interventions/externes',
    'interventions/internes',
    'calendrier',
    'balances',
    'prestations',
        'profile'

  ];

  // Routes autorisées pour TECHNICIEN (en plus des routes USER)
  private readonly TECHNICIEN_ROUTES = [
    'dashboard',
    'interventions/externes',
    'interventions/internes',
    'calendrier',
    'balances',
        'prestations',

    'profile'
  ]; 

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const currentRole = this.authService.getRole();
    const currentUrl = route.routeConfig?.path || '';

    console.log('🔐 RoleGuard - Vérification de la route:', currentUrl);
    console.log('🔐 RoleGuard - Rôle actuel:', currentRole);

    // ADMIN a accès à tout
    if (currentRole === 'ADMIN') {
      console.log('✅ ADMIN - Accès autorisé');
      return true;
    }

    // TECHNICIEN
    if (currentRole === 'TECHNICIEN') {
      const isAllowed = this.TECHNICIEN_ROUTES.some(route => currentUrl.includes(route));
      if (isAllowed) {
        console.log('✅ TECHNICIEN - Accès autorisé à:', currentUrl);
        return true;
      }
      console.log('❌ TECHNICIEN - Accès interdit à:', currentUrl);
      this.router.navigate(['/app/dashboard']);
      return false;
    }

    // USER
    if (currentRole === 'USER') {
      const isAllowed = this.USER_ROUTES.some(route => currentUrl.includes(route));
      if (isAllowed) {
        console.log('✅ USER - Accès autorisé à:', currentUrl);
        return true;
      }
      console.log('❌ USER - Accès interdit à:', currentUrl);
      this.router.navigate(['/app/dashboard']);
      return false;
    }

    console.log('❌ Aucun rôle trouvé - Redirection vers login');
    this.router.navigate(['/login']);
    return false;
  }
}