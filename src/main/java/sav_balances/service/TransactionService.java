package sav_balances.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sav_balances.entity.Intervention;
import sav_balances.entity.Transaction;
import sav_balances.repository.InterventionRepository;
import sav_balances.repository.TransactionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    /**
     * Met à jour l'intervention lors de la définition de la date
     * Passe en TERMINE et crée une transaction automatique
     */
    @Transactional
    public Intervention mettreAJourDateIntervention(Long interventionId, LocalDateTime dateOrdre) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention non trouvée"));
        
        if (intervention.getStatutIntervention() == Intervention.StatutIntervention.ANNULE) {
            throw new RuntimeException("❌ Impossible de modifier une intervention annulée");
        }
        
        // Définir la date d'intervention
        intervention.setDateOrdre(dateOrdre);
        
        // Récupérer le montant total (prix estimé ou prix proposé)
        Double montantTotal = intervention.getPrixEstime();
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = intervention.getPrixPropose();
        }
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = 0.0;
        }
        
        // Mettre à jour les montants
        intervention.setMontantTotal(montantTotal);
        intervention.setMontantPaye(montantTotal);  // Payé = montant total
        intervention.setMontantRestant(0.0);        // Restant = 0
        
        // Passer en TERMINE
        intervention.setStatutIntervention(Intervention.StatutIntervention.TERMINE);
        intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        
        // Créer une transaction automatique si montant > 0
        if (montantTotal > 0) {
            creerTransactionAutomatique(intervention, montantTotal);
            logger.info("💰 Transaction automatique créée pour: {} - Montant: {} DT", 
                       intervention.getNumeroOrdre(), montantTotal);
        }
        
        logger.info("✅ Intervention {} passée en TERMINE (date définie)", intervention.getNumeroOrdre());
        
        return interventionRepository.save(intervention);
    }

    /**
     * Crée une transaction automatique
     */
    private void creerTransactionAutomatique(Intervention intervention, Double montant) {
        Transaction transaction = new Transaction();
        transaction.setIntervention(intervention);
        transaction.setMontant(montant);
        transaction.setMethode(Transaction.MethodePaiement.AUTOMATIQUE);
        transaction.setReference("AUTO-" + intervention.getNumeroOrdre());
        transaction.setStatut(Transaction.StatutTransaction.VALIDE);
        transaction.setDateTransaction(LocalDateTime.now());
        transaction.setNotes("Paiement automatique - Intervention terminée le " + LocalDateTime.now().toLocalDate());
        
        transactionRepository.save(transaction);
        logger.info("💳 Transaction auto créée: {} - {} DT", intervention.getNumeroOrdre(), montant);
    }

    /**
     * Récupère les transactions d'une intervention
     */
    public List<Transaction> getTransactionsByIntervention(Long interventionId) {
        return transactionRepository.findByInterventionIdOrderByDateTransactionDesc(interventionId);
    }

    /**
     * Récupère les transactions par société client
     */
    public List<Transaction> getByClientSociete(String societe) {
        logger.info("Récupération des transactions pour la société : {}", societe);
        if (societe == null || societe.trim().isEmpty()) {
            return List.of();
        }
        return transactionRepository.findByInterventionSociete(societe);
    }

    /**
     * Ajoute un paiement manuel (pour les cas exceptionnels)
     */
   @Transactional
public Transaction ajouterPaiementManuel(Long interventionId, Transaction transaction) {
    Intervention intervention = interventionRepository.findById(interventionId)
            .orElseThrow(() -> new RuntimeException("Intervention non trouvée"));

    if (intervention.getStatutIntervention() == Intervention.StatutIntervention.ANNULE) {
        throw new RuntimeException("❌ Impossible d'ajouter un paiement sur une intervention annulée");
    }
    if (intervention.getStatutIntervention() == Intervention.StatutIntervention.TERMINE) {
        throw new RuntimeException("❌ L'intervention est déjà terminée");
    }

    // ✅ Si montantTotal est 0, on l'initialise avec le montant du paiement
    Double montantTotal = intervention.getMontantTotal();
    if (montantTotal == null || montantTotal == 0) {
        montantTotal = transaction.getMontant();
        intervention.setMontantTotal(montantTotal);
    }

    // Enregistrer la transaction
    transaction.setIntervention(intervention);
    transaction.setDateTransaction(LocalDateTime.now());
    transaction.setStatut(Transaction.StatutTransaction.VALIDE);
    Transaction saved = transactionRepository.save(transaction);

    // Recalculer le total payé
    Double totalPaye = transactionRepository.sumMontantPayeByIntervention(interventionId);
    if (totalPaye == null) totalPaye = 0.0;

    // Mettre à jour les montants de l'intervention
    intervention.setMontantPaye(totalPaye);
    Double montantRestant = Math.max(0, montantTotal - totalPaye);
    intervention.setMontantRestant(montantRestant);

    // Mise à jour des statuts
    if (montantTotal > 0 && totalPaye >= montantTotal) {
        intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        intervention.setStatutIntervention(Intervention.StatutIntervention.TERMINE);
    } else if (totalPaye > 0) {
        intervention.setStatutPaiement(Intervention.StatutPaiement.PARTIEL);
    } else {
        intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
    }

    interventionRepository.save(intervention);
    return saved;
}
    /**
     * Annule une transaction
     */
    @Transactional
    public void annulerTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction non trouvée"));
        
        transaction.setStatut(Transaction.StatutTransaction.ANNULE);
        transactionRepository.save(transaction);
        
        // Recalculer les montants
        Long interventionId = transaction.getIntervention().getId();
        Double totalPaye = transactionRepository.sumMontantPayeByIntervention(interventionId);
        if (totalPaye == null) totalPaye = 0.0;
        
        Intervention intervention = transaction.getIntervention();
        Double montantTotal = intervention.getPrixEstime();
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = intervention.getPrixPropose();
        }
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = 0.0;
        }
        
        intervention.setMontantPaye(totalPaye);
        intervention.setMontantRestant(Math.max(0, montantTotal - totalPaye));
        
        if (totalPaye >= montantTotal && montantTotal > 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        } else if (totalPaye > 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PARTIEL);
        } else {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        }
        
        interventionRepository.save(intervention);
    }
    
}