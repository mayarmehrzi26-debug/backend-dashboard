package sav_balances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sav_balances.entity.Transaction;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByInterventionId(Long interventionId);
    
    List<Transaction> findByInterventionIdOrderByDateTransactionDesc(Long interventionId);
    
    // ⚠️ IMPORTANT: Ne compter que les transactions VALIDE
    @Query("SELECT SUM(t.montant) FROM Transaction t WHERE t.intervention.id = :interventionId AND t.statut = 'VALIDE'")
    Double sumMontantPayeByIntervention(@Param("interventionId") Long interventionId);
}