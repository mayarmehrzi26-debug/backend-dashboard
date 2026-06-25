// src/app/layouts/main-layout/main-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, Event } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent]
})
export class MainLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  currentUser: any;
  pageTitle: string = 'Dashboard';
  isAdmin: boolean = false;

  private routeTitles: { [key: string]: string } = {
    '/app/dashboard': '📊 Tableau de Board',
    '/app/clients': '👥 Gestion des clients',
    '/app/interventions/externes': '🔧 Interventions Externes',
    '/app/interventions/internes': '🔧 Interventions Internes',
    '/app/calendrier': '📅 Calendrier des Interventions',  // ← AJOUT
    '/app/balances': '⚖️ Gestion des Balances',
    '/app/prestations': '🏷️ Gestion des Prestations',
    '/app/users': '👥 Gestion des Utilisateurs',
        '/app/profile': '👥 Gestion du Profile'

    
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
    });
  }

  ngOnInit() {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.urlAfterRedirects);
    });

    this.updatePageTitle(this.router.url);
  }

  private updatePageTitle(url: string) {
    let title = this.routeTitles[url];
    if (!title) {
      for (const [route, routeTitle] of Object.entries(this.routeTitles)) {
        if (url.startsWith(route)) {
          title = routeTitle;
          break;
        }
      }
    }
    if (!title) {
      const segments = url.split('/');
      const lastSegment = segments[segments.length - 1];
      title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) || 'Dashboard';
    }
    this.pageTitle = title;
  }

  onSidebarToggle() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}