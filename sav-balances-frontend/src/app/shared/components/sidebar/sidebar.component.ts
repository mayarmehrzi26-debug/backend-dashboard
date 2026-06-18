import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent {
  @Output() toggle = new EventEmitter<void>();
  isCollapsed = false;
  openSubmenus: { [key: string]: boolean } = {};

  menuItems = [
  { path: '/app/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { path: '/app/clients', icon: 'bi-people', label: 'Clients' },
  { 
    label: 'Interventions', 
    icon: 'bi-tools',
    submenu: [
      { path: '/app/interventions/externes', icon: 'bi-building', label: 'Externes' },
      { path: '/app/interventions/internes', icon: 'bi-house', label: 'Internes' }
    ]
  },
  { path: '/app/balances', icon: 'bi-calculator', label: 'Balances' },
  { path: '/app/prestations', icon: 'bi-tags', label: 'Prestations' }
];

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
}