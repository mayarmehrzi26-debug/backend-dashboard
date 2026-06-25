// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  @Output() toggle = new EventEmitter<void>();
  isCollapsed = false;
  openSubmenus: { [key: string]: boolean } = {};
  isAdmin: boolean = false;

  menuItems = [
    { path: '/app/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/app/clients', icon: 'bi-people', label: 'Clients', adminOnly: true },
    { 
      label: 'Interventions', 
      icon: 'bi-tools',
      submenu: [
        { path: '/app/interventions/externes', icon: 'bi-building', label: 'Externes' },
        { path: '/app/interventions/internes', icon: 'bi-house', label: 'Internes' }
      ]
    },
    // ===== CALENDRIER INDÉPENDANT =====
    { path: '/app/calendrier', icon: 'bi-calendar3', label: 'Calendrier' },
    { path: '/app/prestations', icon: 'bi-tags', label: 'Prestations' },
    { path: '/app/users', icon: 'bi-people-fill', label: ' Utilisateurs', adminOnly: true },
    { path: '/app/profile', icon: 'bi-person-circle', label: 'Mon Profil' }

  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.toggle.emit();
  }

  toggleSubmenu(label: string) {
    this.openSubmenus[label] = !this.openSubmenus[label];
  }

  isSubmenuOpen(label: string): boolean {
    return this.openSubmenus[label] || false;
  }

  getVisibleMenuItems() {
    if (this.isAdmin) {
      return this.menuItems;
    }
    return this.menuItems.filter(item => !item.adminOnly);
  }
}