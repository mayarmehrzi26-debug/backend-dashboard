package sav_balances.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sav_balances.entity.Intervention;
import sav_balances.repository.InterventionRepository;
import sav_balances.repository.TransactionRepository;

@Service
public class InterventionService {

    @Autowired
    private InterventionRepository repo;
    
    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    public Intervention save(Intervention i) {
        if (i.getDateReclamation() == null) {
            i.setDateReclamation(java.time.LocalDateTime.now());
        }
        if (i.getType() == null || i.getType().isEmpty()) {
            i.setType("INTERNE");
        }
        if (i.getReference() == null) {
            i.setReference("");
        }
        
        // Si le prix estimé est défini, mettre à jour le montant total
        if (i.getPrixEstime() != null && i.getPrixEstime() > 0) {
            i.setMontantTotal(i.getPrixEstime());
            i.setMontantPaye(0.0);
            i.setMontantRestant(i.getPrixEstime());
            
            // Si statut EN_ATTENTE, passer à CONFIRME
            if (i.getStatutIntervention() == null || i.getStatutIntervention() == Intervention.StatutIntervention.EN_ATTENTE) {
                i.setStatutIntervention(Intervention.StatutIntervention.CONFIRME);
            }
            i.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        } else {
            if (i.getMontantTotal() == null || i.getMontantTotal() == 0) {
                Double montant = i.getPrixEstime();
                if (montant == null) montant = i.getPrixReel();
                if (montant == null) montant = 0.0;
                i.setMontantTotal(montant);
                i.setMontantPaye(0.0);
                i.setMontantRestant(montant);
                i.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
            }
        }
        
        if (i.getStatutIntervention() == null) {
            i.setStatutIntervention(Intervention.StatutIntervention.EN_ATTENTE);
        }
        
        return repo.save(i);
    }

    @Transactional
    public Intervention updateWithPreservation(Long id, Intervention intervention) {
        Intervention existing = repo.findById(id).orElse(null);
        if (existing == null) return save(intervention);
        
        // Préserver les champs non modifiés
        if (intervention.getType() == null || intervention.getType().isEmpty()) {
            intervention.setType(existing.getType());
        }
        if (intervention.getDateReclamation() == null) {
            intervention.setDateReclamation(existing.getDateReclamation());
        }
        if (intervention.getNumeroOrdre() == null || intervention.getNumeroOrdre().isEmpty()) {
            intervention.setNumeroOrdre(existing.getNumeroOrdre());
        }
        if (intervention.getStatutIntervention() == null) {
            intervention.setStatutIntervention(existing.getStatutIntervention());
        }
        if (intervention.getMontantTotal() == null) {
            intervention.setMontantTotal(existing.getMontantTotal());
        }
        if (intervention.getMontantPaye() == null) {
            intervention.setMontantPaye(existing.getMontantPaye());
        }
        if (intervention.getMontantRestant() == null) {
            intervention.setMontantRestant(existing.getMontantRestant());
        }
        if (intervention.getStatutPaiement() == null) {
            intervention.setStatutPaiement(existing.getStatutPaiement());
        }
        if (intervention.getReference() == null || intervention.getReference().isEmpty()) {
            intervention.setReference(existing.getReference());
        }
        if (intervention.getBascule() == null || intervention.getBascule().isEmpty()) {
            intervention.setBascule(existing.getBascule());
        }
        if (intervention.getReclamation() == null || intervention.getReclamation().isEmpty()) {
            intervention.setReclamation(existing.getReclamation());
        }
        if (intervention.getTechnicien() == null || intervention.getTechnicien().isEmpty()) {
            intervention.setTechnicien(existing.getTechnicien());
        }
        if (intervention.getSociete() == null || intervention.getSociete().isEmpty()) {
            intervention.setSociete(existing.getSociete());
        }
        if (intervention.getPrixPropose() == null) {
            intervention.setPrixPropose(existing.getPrixPropose());
        }
        if (intervention.getDateDiagnostic() == null) {
            intervention.setDateDiagnostic(existing.getDateDiagnostic());
        }
        if (intervention.getDateRecuperation() == null) {
            intervention.setDateRecuperation(existing.getDateRecuperation());
        }
        
        intervention.setId(id);
        return repo.save(intervention);
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

    public List<Intervention> getByType(String type) {
        return repo.findByType(type);
    }
    
    @Transactional
    public Intervention refreshMontants(Long interventionId) {
        Intervention intervention = repo.findById(interventionId).orElse(null);
        if (intervention == null) return null;
        
        Double totalPaye = transactionRepository.sumMontantPayeByIntervention(interventionId);
        if (totalPaye == null) totalPaye = 0.0;
        
        Double montantTotal = intervention.getMontantTotal();
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = intervention.getPrixEstime();
            if (montantTotal == null) montantTotal = intervention.getPrixReel();
            if (montantTotal == null) montantTotal = 0.0;
            intervention.setMontantTotal(montantTotal);
        }
        
        intervention.setMontantPaye(totalPaye);
        Double montantRestant = Math.max(0, montantTotal - totalPaye);
        intervention.setMontantRestant(montantRestant);
        
        // Mise à jour des statuts
        if (montantTotal == 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        } else if (montantRestant <= 0.01) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        } else if (totalPaye == 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        } else {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PARTIEL);
        }
        
        return repo.save(intervention);
    }
    
    public List<Intervention> getInterventionsByClient(String societe) {
        return repo.findBySociete(societe);
    }
}