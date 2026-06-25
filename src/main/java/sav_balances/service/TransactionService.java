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

    @Transactional
    public Transaction ajouterPaiement(Long interventionId, Transaction transaction) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention non trouvée"));

        if (transaction.getMontant() <= 0) {
            throw new RuntimeException("Le montant doit être supérieur à 0");
        }

        // Récupérer les montants actuels
        Double montantTotal = intervention.getMontantTotal();
        Double montantPayeActuel = intervention.getMontantPaye() != null ? intervention.getMontantPaye() : 0.0;
        
        // Si montantTotal est null ou 0, on utilise le montant de la transaction
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = transaction.getMontant();
            intervention.setMontantTotal(montantTotal);
            intervention.setMontantPaye(0.0);
            intervention.setMontantRestant(montantTotal);
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
            interventionRepository.save(intervention);
            montantPayeActuel = 0.0;
        }

        // Calculer le reste à payer
        Double montantRestant = montantTotal - montantPayeActuel;
        if (montantRestant < 0) montantRestant = 0.0;

        // Vérifier si déjà payé
        if (montantTotal > 0 && montantRestant <= 0.01) {
            throw new RuntimeException("Cette intervention est déjà entièrement payée");
        }

        // Vérifier que le montant ne dépasse pas le reste à payer
        if (montantTotal > 0 && transaction.getMontant() > montantRestant) {
            throw new RuntimeException("Le montant (" + transaction.getMontant() + 
                                       " DT) dépasse le reste à payer (" + montantRestant + " DT)");
        }

        // Enregistrer la transaction
        transaction.setIntervention(intervention);
        transaction.setDateTransaction(LocalDateTime.now());
        transaction.setStatut(Transaction.StatutTransaction.VALIDE);

        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // === CRUCIAL: Mettre à jour les montants ET les statuts ===
        updateInterventionComplete(intervention);

        return savedTransaction;
    }

    @Transactional
    public void updateInterventionComplete(Intervention intervention) {
        // 1. Calculer le total payé
        Double totalPaye = transactionRepository.sumMontantPayeByIntervention(intervention.getId());
        if (totalPaye == null) totalPaye = 0.0;

        // 2. Récupérer ou calculer le montant total
        Double montantTotal = intervention.getMontantTotal();
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = intervention.getPrixEstime();
            if (montantTotal == null || montantTotal == 0) {
                montantTotal = intervention.getPrixReel();
            }
            if (montantTotal == null || montantTotal == 0) {
                montantTotal = totalPaye;
            }
            if (montantTotal == null || montantTotal == 0) {
                montantTotal = 0.0;
            }
            intervention.setMontantTotal(montantTotal);
        }

        // 3. Mettre à jour les montants
        intervention.setMontantPaye(totalPaye);
        Double montantRestant = montantTotal - totalPaye;
        if (montantRestant < 0) montantRestant = 0.0;
        intervention.setMontantRestant(montantRestant);

        // 4. === LOGIQUE DE STATUT DE PAIEMENT ===
        if (montantTotal == 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        } else if (montantRestant <= 0.01) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PAYE);
        } else if (totalPaye == 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
        } else {
            intervention.setStatutPaiement(Intervention.StatutPaiement.PARTIEL);
        }

        // 5. === LOGIQUE DE STATUT D'INTERVENTION (CORRIGÉE) ===
        // Ne pas écraser ANNULE
        if (intervention.getStatutIntervention() != Intervention.StatutIntervention.ANNULE) {
            // Règle 1: Paiement complet → TERMINE
            if (montantTotal > 0 && totalPaye >= montantTotal) {
                intervention.setStatutIntervention(Intervention.StatutIntervention.TERMINE);
                logger.info("✅ Intervention {} passée en TERMINE (paiement complet)", intervention.getNumeroOrdre());
            } 
            // Règle 2: Date définie → CONFIRME
            else if (intervention.getDateOrdre() != null) {
                intervention.setStatutIntervention(Intervention.StatutIntervention.CONFIRME);
            } 
            // Règle 3: Sinon → EN_ATTENTE
            else {
                intervention.setStatutIntervention(Intervention.StatutIntervention.EN_ATTENTE);
            }
        }

        // 6. Vérifier la date d'échéance
        if (intervention.getDateEcheance() != null && 
            LocalDateTime.now().isAfter(intervention.getDateEcheance()) &&
            montantRestant > 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_RETARD);
        }

        // 7. Sauvegarder
        interventionRepository.save(intervention);
        
        // 8. Logs pour débogage
        logger.info("=== MISE À JOUR INTERVENTION ===");
        logger.info("ID: {}", intervention.getId());
        logger.info("Numéro: {}", intervention.getNumeroOrdre());
        logger.info("Montant Total: {}", montantTotal);
        logger.info("Montant Payé: {}", totalPaye);
        logger.info("Montant Restant: {}", montantRestant);
        logger.info("Statut Intervention: {}", intervention.getStatutIntervention());
        logger.info("Statut Paiement: {}", intervention.getStatutPaiement());
        logger.info("================================");
    }

    // Ancienne méthode gardée pour compatibilité
    @Transactional
    public void updateInterventionMontants(Intervention intervention) {
        updateInterventionComplete(intervention);
    }

    public List<Transaction> getTransactionsByIntervention(Long interventionId) {
        return transactionRepository.findByInterventionIdOrderByDateTransactionDesc(interventionId);
    }

    @Transactional
    public void annulerTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction non trouvée"));
        
        transaction.setStatut(Transaction.StatutTransaction.ANNULE);
        transactionRepository.save(transaction);
        updateInterventionComplete(transaction.getIntervention());
    }

    public List<Transaction> getByClientSociete(String societe) {
        logger.info("Récupération des transactions pour la société : {}", societe);
        if (societe == null || societe.trim().isEmpty()) {
            logger.warn("Société vide, retour d'une liste vide");
            return List.of();
        }
        List<Transaction> transactions = transactionRepository.findByInterventionSociete(societe);
        logger.info("Nombre de transactions trouvées : {}", transactions.size());
        return transactions;
    }
}