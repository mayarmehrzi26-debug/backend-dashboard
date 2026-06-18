// src/app/modules/balances/balances.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';  // ← AJOUTER
import { ApiService, Balance } from '../../core/services/api.service';

@Component({
  selector: 'app-balances',
  templateUrl: './balances.component.html',
  styleUrls: ['./balances.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule  // ← AJOUTER
  ]
})
export class BalancesComponent implements OnInit {
  balances: Balance[] = [];
  filteredBalances: Balance[] = [];  // ← NOUVEAU
  showForm = false;
  showDetailsModal = false;
  isEditing = false;
  selectedBalance: Balance | null = null;
  balanceForm: FormGroup;
  loading = true;
  private dataLoaded = false;
  searchTerm: string = '';  // ← NOUVEAU

  categories = [
    'Pont bascule 60T',
    'Pont bascule 40T',
    'Pont bascule 30T',
    'Balance électronique',
    'Balance mécanique',
    'Accessoires',
    'Pièces détachées',
    'Autre'
  ];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.balanceForm = this.createForm();
  }

  ngOnInit() {
    this.loadBalances();
  }

  createForm(): FormGroup {
    return this.fb.group({
      reference: ['', Validators.required],
      prix: ['', [Validators.required, Validators.min(0)]],
      categorie: [''],
      description: ['', Validators.required],
      notes: ['']
    });
  }

  loadBalances() {
    if (this.dataLoaded) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.getBalances().subscribe({
      next: (data) => {
        this.balances = data || [];
        this.filteredBalances = [...this.balances];  // ← Initialiser
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement balances:', err);
        this.balances = [];
        this.filteredBalances = [];
        this.loading = false;
        this.cdr.detectChanges();
        alert('Erreur lors du chargement des balances');
      }
    });
  }

  // ==================== MÉTHODES DE RECHERCHE ====================
  
  filterBalances() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredBalances = [...this.balances];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredBalances = this.balances.filter(balance => {
      return (
        balance.reference?.toLowerCase().includes(term) ||
        balance.categorie?.toLowerCase().includes(term) ||
        balance.description?.toLowerCase().includes(term) ||
        balance.prix?.toString().includes(term) ||
        balance.notes?.toLowerCase().includes(term)
      );
    });
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredBalances = [...this.balances];
    this.cdr.detectChanges();
  }

  // ==================== MÉTHODES EXISTANTES ====================

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.selectedBalance = null;
    this.balanceForm.reset({
      reference: '',
      prix: '',
      categorie: '',
      description: '',
      notes: ''
    });
    this.cdr.detectChanges();
  }

  editBalance(balance: Balance) {
    this.isEditing = true;
    this.selectedBalance = balance;
    this.balanceForm.patchValue({
      reference: balance.reference,
      prix: balance.prix,
      categorie: balance.categorie || '',
      description: balance.description,
      notes: balance.notes || ''
    });
    this.showForm = true;
    this.cdr.detectChanges();
  }

  viewBalanceDetails(balance: Balance) {
    this.selectedBalance = balance;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.balanceForm.reset();
    this.cdr.detectChanges();
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedBalance = null;
    this.cdr.detectChanges();
  }

  saveBalance() {
    if (this.balanceForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.balanceForm.value;
    const balance: Balance = {
      reference: formValue.reference,
      prix: formValue.prix,
      categorie: formValue.categorie,
      description: formValue.description,
      notes: formValue.notes,
      dateCreation: new Date().toISOString()
    };

    this.loading = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.selectedBalance) {
      this.apiService.updateBalance(this.selectedBalance.id!, balance).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadBalances();
          this.closeForm();
          alert('Balance modifiée avec succès');
        },
        error: (err) => {
          console.error('Erreur modification:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la modification');
        }
      });
    } else {
      this.apiService.createBalance(balance).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadBalances();
          this.closeForm();
          alert('Balance créée avec succès');
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la création');
        }
      });
    }
  }

  deleteBalance(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette balance ?')) {
      this.loading = true;
      this.cdr.detectChanges();
      
      this.apiService.deleteBalance(id).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadBalances();
          alert('Balance supprimée');
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  refresh() {
    this.dataLoaded = false;
    this.searchTerm = '';
    this.loadBalances();
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '—';
    }
  }
}