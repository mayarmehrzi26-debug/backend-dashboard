package sav_balances.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import sav_balances.entity.Intervention;
import sav_balances.entity.Prestation;
import sav_balances.repository.BalanceRepository;
import sav_balances.repository.InterventionRepository;
import sav_balances.repository.PrestationRepository;

@Service
public class InterventionService {

    @Autowired
    private InterventionRepository repo;
    
    @Autowired
    private BalanceRepository balanceRepository;
    
    @Autowired
    private PrestationRepository prestationRepository;

    public Intervention save(Intervention i) {
        if (i.getDateReclamation() == null) {
            i.setDateReclamation(java.time.LocalDateTime.now());
        }
        if (i.getDateOrdre() == null) {
            i.setDateOrdre(java.time.LocalDateTime.now());
        }
        if (i.getType() == null || i.getType().isEmpty()) {
            i.setType("EXTERNE");
        }
        if (i.getReference() == null) {
            i.setReference("");
        }
        
        // Initialiser les montants de paiement
        if (i.getMontantTotal() == null || i.getMontantTotal() == 0) {
            Double montant = i.getPrixEstime();
            if (montant == null) {
                montant = i.getPrixReel();
            }
            if (montant == null) {
                montant = 0.0;
            }
            i.setMontantTotal(montant);
            i.setMontantPaye(0.0);
            i.setMontantRestant(montant);
            i.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        }
        
        return repo.save(i);
    }

    public List<Intervention> getAll() {
        return repo.findAll();
    }

    public Intervention getById(Long id) {
        return repo.findById(id).orElse(null);
    }
    
    public void deleteById(Long id) {
        repo.deleteById(id);
    }
    
    public Intervention saveWithPrestation(Intervention i, Long prestationId) {
        if (i.getDateReclamation() == null) {
            i.setDateReclamation(java.time.LocalDateTime.now());
        }
        if (i.getDateOrdre() == null) {
            i.setDateOrdre(java.time.LocalDateTime.now());
        }
        if (i.getReference() == null) {
            i.setReference("");
        }
        
        if (prestationId != null) {
            Prestation prestation = prestationRepository.findById(prestationId).orElse(null);
            if (prestation != null) {
                i.setPrestation(prestation);
                if (prestation.getPrixForfait() != null) {
                    i.setPrixEstime(prestation.getPrixForfait());
                } else if (prestation.getPrixHeure() != null && prestation.getDureeEstimeeHeures() != null) {
                    i.setPrixEstime(prestation.getPrixHeure() * prestation.getDureeEstimeeHeures());
                }
                if (prestation.getNom() != null) {
                    i.setReclamation(prestation.getNom());
                }
            }
        }
        
        // Initialiser les montants de paiement après la prestation
        if (i.getMontantTotal() == null || i.getMontantTotal() == 0) {
            Double montant = i.getPrixEstime();
            if (montant == null) {
                montant = i.getPrixReel();
            }
            if (montant == null) {
                montant = 0.0;
            }
            i.setMontantTotal(montant);
            i.setMontantPaye(0.0);
            i.setMontantRestant(montant);
            i.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        }
        
        return repo.save(i);
    }

    public List<Intervention> getInterventionsByPrestation(Long prestationId) {
        return repo.findByPrestationId(prestationId);
    }
    
    public List<Intervention> getByType(String type) {
        return repo.findByType(type);
    }
    
    // ========== MÉTHODES POUR LA GESTION DES PAIEMENTS ==========
    
    /**
     * Méthode pour forcer la mise à jour des montants et du statut
     */
    public Intervention refreshMontants(Long interventionId) {
        Intervention intervention = repo.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        // Récupérer le total payé
        Double totalPaye = repo.sumMontantPayeByIntervention(interventionId);
        if (totalPaye == null) totalPaye = 0.0;
        
        Double montantTotal = intervention.getMontantTotal();
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = intervention.getPrixEstime();
            if (montantTotal == null) {
                montantTotal = intervention.getPrixReel();
            }
            if (montantTotal == null) {
                montantTotal = 0.0;
            }
            intervention.setMontantTotal(montantTotal);
        }
        
        intervention.setMontantPaye(totalPaye);
        Double montantRestant = montantTotal - totalPaye;
        if (montantRestant < 0) montantRestant = 0.0;
        intervention.setMontantRestant(montantRestant);
        
        // Mettre à jour le statut
        if (montantTotal == 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        } else if (montantRestant <= 0.01) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        } else if (totalPaye == 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        } else {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PARTIEL);
        }
        
        // Vérifier les retards
        if (intervention.getDateEcheance() != null && 
            java.time.LocalDateTime.now().isAfter(intervention.getDateEcheance()) &&
            montantRestant > 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_RETARD);
        }
        
        return repo.save(intervention);
    }
    
    /**
     * Récupérer les interventions par statut de paiement
     */
    public List<Intervention> getByStatutPaiement(Intervention.StatutPaiement statut) {
        return repo.findByStatutPaiement(statut);
    }
    
    /**
     * Récupérer les interventions en retard de paiement
     */
    public List<Intervention> getInterventionsEnRetard() {
        return repo.findByDateEcheanceBeforeAndStatutPaiementNotPaye(java.time.LocalDateTime.now());
    }
    
    /**
     * Récupérer les interventions avec paiement partiel
     */
    public List<Intervention> getInterventionsPaiementPartiel() {
        return repo.findByStatutPaiement(Intervention.StatutPaiement.PARTIEL);
    }
    
    /**
     * Récupérer les interventions entièrement payées
     */
    public List<Intervention> getInterventionsPayees() {
        return repo.findByStatutPaiement(Intervention.StatutPaiement.PAYE);
    }
    
    /**
     * Récupérer les interventions en attente de paiement
     */
    public List<Intervention> getInterventionsEnAttente() {
        return repo.findByStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
    }
}