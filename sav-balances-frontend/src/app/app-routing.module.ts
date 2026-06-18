// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { InterventionsInternesComponent } from './modules/interventions-internes/interventions-internes.component';
import { InterventionsExternesComponent } from './modules/interventions-externes/interventions-externes.component';

export const routes: Routes = [
  // La route vide redirige vers login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Page de login
  { path: 'login', component: LoginComponent },
  
  // Routes protégées par le guard
  {
    path: 'app', // ou 'dashboard' selon votre préférence
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'clients', loadComponent: () => import('./modules/clients/clients.component').then(m => m.ClientsComponent) },
      { path: 'interventions/externes', component: InterventionsExternesComponent },
      { path: 'interventions/internes', component: InterventionsInternesComponent },
      { path: 'balances', loadComponent: () => import('./modules/balances/balances.component').then(m => m.BalancesComponent) },
      { path: 'prestations', loadComponent: () => import('./modules/prestations/prestations.component').then(m => m.PrestationsComponent) },
    ]
  },
  
  // Redirection pour les routes inconnues
  { path: '**', redirectTo: 'login' }
];