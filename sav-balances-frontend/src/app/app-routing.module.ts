// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { InterventionsInternesComponent } from './modules/interventions-internes/interventions-internes.component';
import { InterventionsExternesComponent } from './modules/interventions-externes/interventions-externes.component';
import { UsersComponent } from './modules/users/users.component';
import { CalendrierComponent } from './modules/calendrier/calendrier.component'; // ← IMPORT

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  {
    path: 'app',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      { 
        path: 'clients', 
        loadComponent: () => import('./modules/clients/clients.component').then(m => m.ClientsComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      { 
        path: 'interventions/externes', 
        component: InterventionsExternesComponent,
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      { 
        path: 'interventions/internes', 
        component: InterventionsInternesComponent,
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      // ===== CALENDRIER INDÉPENDANT =====
      { 
        path: 'calendrier', 
        component: CalendrierComponent,
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }  // Accessible à USER et ADMIN
      },
      { 
        path: 'balances', 
        loadComponent: () => import('./modules/balances/balances.component').then(m => m.BalancesComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      { 
        path: 'prestations', 
        loadComponent: () => import('./modules/prestations/prestations.component').then(m => m.PrestationsComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./modules/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [RoleGuard],
        data: { expectedRole: 'USER' }
      },
      { 
        path: 'users', 
        component: UsersComponent,
        canActivate: [RoleGuard],
        data: { expectedRole: 'ADMIN' }
      }
    ]
  },
  
  { path: '**', redirectTo: 'login' }
];