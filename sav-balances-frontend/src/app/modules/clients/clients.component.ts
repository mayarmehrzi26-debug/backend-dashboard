// src/app/modules/clients/clients.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService, Client } from '../../core/services/api.service';
import { FormsModule } from '@angular/forms';  
@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
   
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];  // ← NOUVEAU : Liste filtrée
  showForm = false;
  showNotesModal = false;
  showDetailsModal = false;
  isEditing = false;
  selectedClient: Client | null = null;
  clientDetails: Client | null = null;
  clientForm: FormGroup;
  notesForm: FormGroup;
  loading = true;
  detailsLoading = false;
  private dataLoaded = false;
  searchTerm: string = '';  // ← NOUVEAU : Terme de recherche
  
  comportements = [
    { value: 'EXCELLENT', label: '🌟 Excellent', color: 'success', icon: 'bi-star-fill' },
    { value: 'PROFESSIONNEL', label: '👔 Professionnel', color: 'primary', icon: 'bi-briefcase' },
    { value: 'DIFFICILE', label: '⚠️ Difficile', color: 'warning', icon: 'bi-exclamation-triangle' },
    { value: 'IMPOLI', label: '😤 Impoli', color: 'danger', icon: 'bi-emoji-angry' },
    { value: 'A_EVITER', label: '🚫 À éviter', color: 'dark', icon: 'bi-shield-x' }
  ];
  
  statutsPaiement = [
    { value: 'PONCTUEL', label: '✅ Ponctuel', color: 'success' },
    { value: 'RETARD_OCCASIONNEL', label: '⚠️ Retard occasionnel', color: 'warning' },
    { value: 'RETARD_FREQUENT', label: '🔥 Retard fréquent', color: 'danger' },
    { value: 'TRES_RETARD', label: '💀 Très mauvais payeur', color: 'dark' }
  ];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.clientForm = this.createForm();
    this.notesForm = this.createNotesForm();
  }

  ngOnInit() {
    this.loadClients();
  }

  createForm(): FormGroup {
    return this.fb.group({
      societe: [''],
      responsable: [''],
      telephone: [''],
      adresse: [''],
      email: ['']
    });
  }
  
  createNotesForm(): FormGroup {
    return this.fb.group({
      notes: [''],
      comportement: [''],
      note: [3],
      statutPaiement: [''],
      negociateur: [false],
      clientFidele: [false]
    });
  }

  loadClients() {
    if (this.dataLoaded) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data || [];
        this.filteredClients = [...this.clients];  // ← Initialiser la liste filtrée
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.clients = [];
        this.filteredClients = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== MÉTHODE DE RECHERCHE ====================
  
  filterClients() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredClients = [...this.clients];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredClients = this.clients.filter(client => {
      return (
        client.societe?.toLowerCase().includes(term) ||
        client.responsable?.toLowerCase().includes(term) ||
        client.telephone?.includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.adresse?.toLowerCase().includes(term)
      );
    });
    this.cdr.detectChanges();
  }

  // Méthode pour effacer la recherche
  clearSearch() {
    this.searchTerm = '';
    this.filteredClients = [...this.clients];
    this.cdr.detectChanges();
  }

  // ==================== MÉTHODES EXISTANTES ====================

  viewClientDetails(client: Client) {
    this.detailsLoading = true;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
    
    this.apiService.getClient(client.id!).subscribe({
      next: (data) => {
        this.clientDetails = data;
        this.detailsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement détails:', err);
        this.detailsLoading = false;
        this.cdr.detectChanges();
        alert('Erreur lors du chargement des détails');
      }
    });
  }

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.selectedClient = null;
    this.clientForm.reset({
      societe: '',
      responsable: '',
      telephone: '',
      adresse: '',
      email: ''
    });
    this.cdr.detectChanges();
  }
  
  openNotesModal(client: Client) {
    this.selectedClient = client;
    this.notesForm.patchValue({
      notes: client.notes || '',
      comportement: client.comportement || '',
      note: client.note || 3,
      statutPaiement: client.statutPaiement || '',
      negociateur: client.negociateur || false,
      clientFidele: client.clientFidele || false
    });
    this.showNotesModal = true;
    this.cdr.detectChanges();
  }
  
  saveNotes() {
    if (!this.selectedClient) return;
    
    const evaluationData = {
      notes: this.notesForm.value.notes,
      comportement: this.notesForm.value.comportement,
      note: this.notesForm.value.note,
      statutPaiement: this.notesForm.value.statutPaiement,
      negociateur: this.notesForm.value.negociateur,
      clientFidele: this.notesForm.value.clientFidele
    };
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.patchClient(this.selectedClient.id!, evaluationData).subscribe({
      next: () => {
        this.dataLoaded = false;
        this.loadClients();
        this.showNotesModal = false;
        this.loading = false;
        alert('Évaluation enregistrée avec succès');
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('Erreur lors de l\'enregistrement');
      }
    });
  }

  closeForm() {
    this.showForm = false;
    this.clientForm.reset();
    this.cdr.detectChanges();
  }
  
  closeNotesModal() {
    this.showNotesModal = false;
    this.cdr.detectChanges();
  }
  
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.clientDetails = null;
    this.cdr.detectChanges();
  }

  editClient(client: Client) {
    this.isEditing = true;
    this.selectedClient = client;
    this.clientForm.patchValue({
      societe: client.societe || '',
      responsable: client.responsable || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      email: client.email || ''
    });
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveClient() {
    if (!this.isEditing) {
      if (!this.clientForm.value.societe || !this.clientForm.value.responsable) {
        alert('Veuillez remplir la Société et le Responsable');
        return;
      }
    }

    const client = this.clientForm.value;
    this.loading = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.selectedClient) {
      const updatedClient = {
        ...this.selectedClient,
        ...client
      };
      this.apiService.updateClient(this.selectedClient.id!, updatedClient).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadClients();
          this.closeForm();
          alert('Client modifié avec succès');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la modification');
        }
      });
    } else {
      this.apiService.createClient(client).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadClients();
          this.closeForm();
          alert('Client créé avec succès');
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

  deleteClient(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      this.loading = true;
      this.cdr.detectChanges();
      
      this.apiService.deleteClient(id).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadClients();
          alert('Client supprimé');
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

  refresh() {
    this.dataLoaded = false;
    this.searchTerm = '';
    this.loadClients();
  }
  
  getComportementColor(comportement: string): string {
    const found = this.comportements.find(c => c.value === comportement);
    return found ? found.color : 'secondary';
  }
  
  getComportementIcon(comportement: string): string {
    const found = this.comportements.find(c => c.value === comportement);
    return found ? found.icon : 'bi-person';
  }
  
  getPaiementColor(statut: string): string {
    const found = this.statutsPaiement.find(s => s.value === statut);
    return found ? found.color : 'secondary';
  }
  
  getPaiementLabel(statut: string): string {
    const found = this.statutsPaiement.find(s => s.value === statut);
    return found ? found.label : 'Non renseigné';
  }
  
  getStars(note: number): string {
    return '★'.repeat(note) + '☆'.repeat(5 - note);
  }
  
  formatDate(date: string): string {
    if (!date) return 'Non renseigné';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}