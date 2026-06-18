// src/app/modules/prestations/prestations.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestationService } from '../../core/services/prestation.service';
import { Prestation } from '../../models/prestation.model';

@Component({
  selector: 'app-prestations',
  templateUrl: './prestations.component.html',
  styleUrls: ['./prestations.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PrestationsComponent implements OnInit {
  prestations: Prestation[] = [];
  filteredPrestations: Prestation[] = [];  // ← NOUVEAU
  showForm = false;
  showDetailsModal = false;
  isEditing = false;
  selectedPrestation: Prestation | null = null;
  selectedPrestationDetails: Prestation | null = null;
  loading = true;
  searchTerm: string = '';  // ← NOUVEAU
  
  newPrestation: Prestation = {
    code: '',
    nom: '',
    description: '',
    prixForfait: undefined,
    prixHeure: undefined,
    dureeEstimeeHeures: 1,
    actif: true,
    ordreAffichage: 0
  };

  constructor(
    private prestationService: PrestationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPrestations();
  }

  loadPrestations() {
    this.loading = true;
    this.prestationService.getAllPrestations().subscribe({
      next: (data) => {
        this.prestations = data;
        this.filteredPrestations = [...this.prestations];  // ← Initialiser
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== MÉTHODES DE RECHERCHE ====================
  
  filterPrestations() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredPrestations = [...this.prestations];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPrestations = this.prestations.filter(prestation => {
      return (
        prestation.code?.toLowerCase().includes(term) ||
        prestation.nom?.toLowerCase().includes(term) ||
        prestation.description?.toLowerCase().includes(term) ||
        prestation.prixForfait?.toString().includes(term) ||
        prestation.prixHeure?.toString().includes(term)
      );
    });
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredPrestations = [...this.prestations];
    this.cdr.detectChanges();
  }

  // ==================== MÉTHODES EXISTANTES ====================

  viewDetails(prestation: Prestation) {
    this.selectedPrestationDetails = { ...prestation };
    this.showDetailsModal = true;
    this.cdr.detectChanges();
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPrestationDetails = null;
    this.cdr.detectChanges();
  }

  editFromDetails() {
    if (this.selectedPrestationDetails) {
      this.closeDetailsModal();
      this.editPrestation(this.selectedPrestationDetails);
    }
  }

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.selectedPrestation = null;
    this.newPrestation = {
      code: '',
      nom: '',
      description: '',
      prixForfait: undefined,
      prixHeure: undefined,
      dureeEstimeeHeures: 1,
      actif: true,
      ordreAffichage: this.prestations.length + 1
    };
  }

  editPrestation(prestation: Prestation) {
    this.isEditing = true;
    this.selectedPrestation = prestation;
    this.newPrestation = { ...prestation };
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  savePrestation() {
    if (!this.newPrestation.nom) {
      alert('Veuillez saisir un nom');
      return;
    }

    if (this.isEditing && this.selectedPrestation) {
      this.prestationService.updatePrestation(this.selectedPrestation.id!, this.newPrestation).subscribe({
        next: () => {
          this.loadPrestations();
          this.closeForm();
          alert('Prestation modifiée avec succès');
        },
        error: (err) => console.error('Erreur:', err)
      });
    } else {
      this.prestationService.createPrestation(this.newPrestation).subscribe({
        next: () => {
          this.loadPrestations();
          this.closeForm();
          alert('Prestation créée avec succès');
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  deletePrestation(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      this.prestationService.deletePrestation(id).subscribe({
        next: () => {
          this.loadPrestations();
          alert('Prestation supprimée');
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  toggleActif(prestation: Prestation) {
    prestation.actif = !prestation.actif;
    this.prestationService.updatePrestation(prestation.id!, prestation).subscribe({
      next: () => this.loadPrestations(),
      error: (err) => console.error('Erreur:', err)
    });
  }

  getPrixLabel(prestation: Prestation): string {
    if (prestation.prixForfait) {
      return `${prestation.prixForfait} DT (forfait)`;
    } else if (prestation.prixHeure) {
      return `${prestation.prixHeure} DT/heure`;
    }
    return 'Prix variable';
  }
}