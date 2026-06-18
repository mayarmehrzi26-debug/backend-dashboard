package sav_balances.service;

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

        // Initialiser montantTotal si nécessaire
        if (intervention.getMontantTotal() == null || intervention.getMontantTotal() == 0) {
            Double montant = intervention.getPrixEstime();
            if (montant == null || montant == 0) {
                montant = intervention.getPrixReel();
            }
            if (montant == null || montant == 0) {
                montant = transaction.getMontant();
            }
            intervention.setMontantTotal(montant);
            intervention.setMontantPaye(0.0);
            intervention.setMontantRestant(montant);
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
            interventionRepository.save(intervention);
        }

        // Calculer le reste à payer
        Double montantRestant = intervention.getMontantTotal() - (intervention.getMontantPaye() != null ? intervention.getMontantPaye() : 0);
        if (montantRestant < 0) montantRestant = 0.0;

        if (montantRestant <= 0.01) {
            throw new RuntimeException("Cette intervention est déjà entièrement payée");
        }

        if (transaction.getMontant() > montantRestant) {
            throw new RuntimeException("Le montant (" + transaction.getMontant() + 
                                       " DT) dépasse le reste à payer (" + montantRestant + " DT)");
        }

        transaction.setIntervention(intervention);
        transaction.setDateTransaction(LocalDateTime.now());
        transaction.setStatut(Transaction.StatutTransaction.VALIDE);

        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // ⚠️ IMPORTANT: Mettre à jour les montants APRÈS la sauvegarde
        updateInterventionMontants(intervention);

        return savedTransaction;
    }

    @Transactional
    public void updateInterventionMontants(Intervention intervention) {
        // Récupérer le total payé à partir des transactions VALIDE
        Double totalPaye = transactionRepository.sumMontantPayeByIntervention(intervention.getId());
        if (totalPaye == null) totalPaye = 0.0;

        // S'assurer que montantTotal est défini
        Double montantTotal = intervention.getMontantTotal();
        if (montantTotal == null || montantTotal == 0) {
            montantTotal = intervention.getPrixEstime();
            if (montantTotal == null || montantTotal == 0) {
                montantTotal = intervention.getPrixReel();
            }
            if (montantTotal == null || montantTotal == 0) {
                montantTotal = 0.0;
            }
            intervention.setMontantTotal(montantTotal);
        }

        // Mettre à jour les montants
        intervention.setMontantPaye(totalPaye);
        Double montantRestant = montantTotal - totalPaye;
        if (montantRestant < 0) montantRestant = 0.0;
        intervention.setMontantRestant(montantRestant);

        // ⚠️ LOGIQUE DE STATUT CORRIGÉE
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
            LocalDateTime.now().isAfter(intervention.getDateEcheance()) &&
            montantRestant > 0) {
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_RETARD);
        }

        // Sauvegarder l'intervention avec les nouveaux montants et statut
        interventionRepository.save(intervention);
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
        
        // Mettre à jour les montants de l'intervention
        updateInterventionMontants(transaction.getIntervention());
    }
}