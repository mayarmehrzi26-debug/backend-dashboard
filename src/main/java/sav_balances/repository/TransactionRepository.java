// sav_balances/repository/TransactionRepository.java
package sav_balances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sav_balances.entity.Transaction;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Récupérer toutes les transactions d'une intervention
    List<Transaction> findByInterventionId(Long interventionId);

    // Récupérer les transactions d'une intervention triées par date décroissante
    List<Transaction> findByInterventionIdOrderByDateTransactionDesc(Long interventionId);

    // Récupérer les transactions par statut
    List<Transaction> findByStatut(String statut);

    // Récupérer les transactions par la société de l'intervention (pour le portefeuille client)
    @Query("SELECT t FROM Transaction t WHERE t.intervention.societe = :societe")
    List<Transaction> findByInterventionSociete(@Param("societe") String societe);

    // Calculer le total des montants payés pour une intervention
    @Query("SELECT SUM(t.montant) FROM Transaction t WHERE t.intervention.id = :interventionId AND t.statut = 'VALIDE'")
    Double sumMontantPayeByIntervention(@Param("interventionId") Long interventionId);
}