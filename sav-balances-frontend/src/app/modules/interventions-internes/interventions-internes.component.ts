// src/app/modules/interventions-internes/interventions-internes.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';  // ← AJOUTER
import { ApiService, Intervention } from '../../core/services/api.service';
import { PrestationService } from '../../core/services/prestation.service';
import { Prestation } from '../../models/prestation.model';
import { Balance } from '../../core/services/api.service';

@Component({
  selector: 'app-interventions-internes',
  templateUrl: './interventions-internes.component.html',
  styleUrls: ['./interventions-internes.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule  // ← AJOUTER
  ]
})
export class InterventionsInternesComponent implements OnInit {
  interventions: Intervention[] = [];
  filteredInterventions: Intervention[] = [];  // ← NOUVEAU
  balances: Balance[] = [];
  prestations: Prestation[] = [];
  showForm = false;
  showDetailsModal = false;
  isEditing = false;
  selectedIntervention: Intervention | null = null;
  interventionDetails: Intervention | null = null;
  interventionForm: FormGroup;
  loading = true;
  detailsLoading = false;
  private dataLoaded = false;
  searchInterventionsTerm: string = '';  // ← NOUVEAU

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private prestationService: PrestationService
  ) {
    this.interventionForm = this.createForm();
  }

  ngOnInit() {
    this.loadInterventions();
    this.loadBalances();
    this.loadPrestations();
  }

  createForm(): FormGroup {
    return this.fb.group({
      numeroOrdre: [{ value: '', disabled: true }],
      type: [{ value: 'INTERNE', disabled: true }],
      balanceId: ['', Validators.required],
      bascule: [{ value: '', disabled: true }],
      reference: [{ value: '', disabled: true }],
      prestationId: ['', Validators.required],
      reclamation: [{ value: '', disabled: true }],
      technicien: ['', Validators.required],
      dateReclamation: [new Date().toISOString().slice(0, 16)],
      dateOrdre: [new Date().toISOString().slice(0, 16)],
      rapportIntervention: ['']
    });
  }

  // ==================== MÉTHODE DE RECHERCHE ====================
  
  filterInterventions() {
    if (!this.searchInterventionsTerm || this.searchInterventionsTerm.trim() === '') {
      this.filteredInterventions = [...this.interventions];
      return;
    }

    const term = this.searchInterventionsTerm.toLowerCase().trim();
    this.filteredInterventions = this.interventions.filter(interv => {
      return (
        interv.numeroOrdre?.toLowerCase().includes(term) ||
        interv.bascule?.toLowerCase().includes(term) ||
        interv.reclamation?.toLowerCase().includes(term) ||
        interv.technicien?.toLowerCase().includes(term) ||
        interv.reference?.toLowerCase().includes(term)
      );
    });
    this.cdr.detectChanges();
  }

  clearInterventionsSearch() {
    this.searchInterventionsTerm = '';
    this.filteredInterventions = [...this.interventions];
    this.cdr.detectChanges();
  }

  loadInterventions() {
    if (this.dataLoaded) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.getInterventionsByType('INTERNE').subscribe({
      next: (data) => {
        this.interventions = data || [];
        this.filteredInterventions = [...this.interventions];  // ← Initialiser
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.interventions = [];
        this.filteredInterventions = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBalances() {
    this.apiService.getBalances().subscribe({
      next: (data) => {
        this.balances = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement balances:', err)
    });
  }

  loadPrestations() {
    this.prestationService.getPrestations().subscribe({
      next: (data) => {
        this.prestations = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement prestations:', err)
    });
  }

  onBalanceSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const balanceId = Number(select.value);
    const selectedBalance = this.balances.find(b => b.id === balanceId);
    
    if (selectedBalance) {
      this.interventionForm.patchValue({
        balanceId: balanceId,
        bascule: selectedBalance.categorie || selectedBalance.reference,
        reference: selectedBalance.reference || ''
      });
    } else {
      this.interventionForm.patchValue({
        balanceId: null,
        bascule: '',
        reference: ''
      });
    }
    this.cdr.detectChanges();
  }

  onPrestationSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const prestationId = Number(select.value);
    const selectedPrestation = this.prestations.find(p => p.id === prestationId);
    
    if (selectedPrestation) {
      this.interventionForm.patchValue({
        prestationId: prestationId,
        reclamation: selectedPrestation.nom
      });
    }
    this.cdr.detectChanges();
  }

  generateNumeroOrdre(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INT-${random}`;
  }

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.selectedIntervention = null;
    
    const newNumeroOrdre = this.generateNumeroOrdre();
    
    this.interventionForm.reset({
      numeroOrdre: newNumeroOrdre,
      type: 'INTERNE',
      balanceId: '',
      bascule: '',
      reference: '',
      prestationId: '',
      reclamation: '',
      technicien: '',
      dateReclamation: new Date().toISOString().slice(0, 16),
      dateOrdre: new Date().toISOString().slice(0, 16),
      rapportIntervention: ''
    });
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.interventionForm.reset();
    this.cdr.detectChanges();
  }

  editIntervention(intervention: Intervention) {
    this.isEditing = true;
    this.selectedIntervention = intervention;
    
    let balance = null;
    if (intervention.bascule) {
      balance = this.balances.find(b => 
        b.categorie === intervention.bascule || 
        intervention.bascule.includes(b.reference || '')
      );
    }
    const prestation = this.prestations.find(p => p.nom === intervention.reclamation);
    
    this.interventionForm.patchValue({
      numeroOrdre: intervention.numeroOrdre,
      type: intervention.type,
      balanceId: balance?.id,
      bascule: intervention.bascule,
      reference: intervention.reference || balance?.reference || '',
      prestationId: prestation?.id,
      reclamation: intervention.reclamation,
      technicien: intervention.technicien,
      dateReclamation: intervention.dateReclamation?.slice(0, 16),
      dateOrdre: intervention.dateOrdre?.slice(0, 16),
      rapportIntervention: intervention.rapportIntervention
    });
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveIntervention() {
    if (this.interventionForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.interventionForm.getRawValue();
    const intervention: Intervention = {
      numeroOrdre: formValue.numeroOrdre,
      type: 'INTERNE',
      bascule: formValue.bascule,
      reference: formValue.reference || '',
      reclamation: formValue.reclamation,
      technicien: formValue.technicien,
      dateReclamation: formValue.dateReclamation,
      dateOrdre: formValue.dateOrdre,
      rapportIntervention: formValue.rapportIntervention,
      societe: 'Interne',
      responsable: 'Interne',
      telephone: '',
      adresse: '',
      email: '',
      prestationId: formValue.prestationId
    };

    this.loading = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.selectedIntervention) {
      this.apiService.updateIntervention(this.selectedIntervention.id!, intervention).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          alert('Intervention modifiée avec succès');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la modification');
        }
      });
    } else {
      this.apiService.createIntervention(intervention).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          alert('Intervention créée avec succès');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la création');
        }
      });
    }
  }

  deleteIntervention(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      this.loading = true;
      this.cdr.detectChanges();
      
      this.apiService.deleteIntervention(id).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          alert('Intervention supprimée');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  exportFormulaire(id: number) {
    this.apiService.exportFormulaireInternePdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intervention_interne_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('✅ PDF téléchargé avec succès');
      },
      error: (err) => {
        console.error('Erreur export:', err);
        alert('❌ Erreur lors de l\'export du PDF');
      }
    });
  }

  refresh() {
    this.dataLoaded = false;
    this.loadInterventions();
    this.loadBalances();
    this.loadPrestations();
  }

  viewInterventionDetails(intervention: Intervention) {
    this.detailsLoading = true;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
    
    this.apiService.getIntervention(intervention.id!).subscribe({
      next: (data) => {
        this.interventionDetails = {
          ...data,
          reference: data.reference || intervention.reference || '-'
        };
        this.detailsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement détails:', err);
        this.interventionDetails = {
          ...intervention,
          reference: intervention.reference || '-'
        };
        this.detailsLoading = false;
        this.cdr.detectChanges();
        alert('Erreur lors du chargement des détails');
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.interventionDetails = null;
    this.cdr.detectChanges();
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return 'Non renseigné';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Date invalide';
    }
  }
}