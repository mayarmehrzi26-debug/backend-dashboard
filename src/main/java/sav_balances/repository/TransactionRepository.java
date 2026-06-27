// sav_balances/repository/TransactionRepository.java
package sav_balances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sav_balances.entity.Transaction;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // ✅ CORRIGÉ : requête explicite au lieu du nom dérivé
    // (évite le conflit avec le getter getInterventionId() de l'entité)
    @Query("SELECT t FROM Transaction t WHERE t.intervention.id = :interventionId")
    List<Transaction> findByInterventionId(@Param("interventionId") Long interventionId);

    // ✅ CORRIGÉ : requête explicite au lieu du nom dérivé
    @Query("SELECT t FROM Transaction t WHERE t.intervention.id = :interventionId ORDER BY t.dateTransaction DESC")
    List<Transaction> findByInterventionIdOrderByDateTransactionDesc(@Param("interventionId") Long interventionId);

    // Récupérer les transactions par statut
    List<Transaction> findByStatut(String statut);

    // Récupérer les transactions par la société de l'intervention (pour le portefeuille client)
    @Query("SELECT t FROM Transaction t WHERE t.intervention.societe = :societe")
    List<Transaction> findByInterventionSociete(@Param("societe") String societe);

    // Calculer le total des montants payés pour une intervention
    @Query("SELECT SUM(t.montant) FROM Transaction t WHERE t.intervention.id = :interventionId AND t.statut = 'VALIDE'")
    Double sumMontantPayeByIntervention(@Param("interventionId") Long interventionId);
}