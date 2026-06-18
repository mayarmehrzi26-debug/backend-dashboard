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

  // Mapping des routes vers les titres
  private routeTitles: { [key: string]: string } = {
    '/app/dashboard': 'Tableau de Board',
    '/app/clients': 'Gestion des clients',
    '/app/interventions/externes': 'Gestion des Interventions Externes',
    '/app/interventions/internes': 'Gestion des Interventions Internes',
    '/app/balances': 'Gestion des Balances',
    '/app/prestations': 'Gestion des Prestations'
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    // Mettre à jour le titre lors du changement de route
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.urlAfterRedirects);
    });

    // Mettre à jour le titre initial
    this.updatePageTitle(this.router.url);
  }

  private updatePageTitle(url: string) {
    // Chercher le titre correspondant à la route
    let title = this.routeTitles[url];
    
    // Si le titre n'est pas trouvé, essayer de faire correspondre partiellement
    if (!title) {
      for (const [route, routeTitle] of Object.entries(this.routeTitles)) {
        if (url.startsWith(route)) {
          title = routeTitle;
          break;
        }
      }
    }
    
    // Si toujours pas trouvé, définir un titre par défaut
    if (!title) {
      // Extraire le dernier segment de l'URL
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