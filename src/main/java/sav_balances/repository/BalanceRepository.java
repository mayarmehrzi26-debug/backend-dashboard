package sav_balances.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import sav_balances.entity.Balance;
import sav_balances.entity.Client;

public interface BalanceRepository extends JpaRepository<Balance, Long> {
    List<Balance> findByClient(Client client);
    List<Balance> findByClientId(Long clientId);
    List<Balance> findByInterventionId(Long interventionId);
    
    // Recherche par référence
    List<Balance> findByReferenceContaining(String reference);
    
    // Recherche par catégorie
    List<Balance> findByCategorie(String categorie);
    
    // Changé de montant à prix
    @Query("SELECT SUM(b.prix) FROM Balance b WHERE b.client.id = :clientId")
    Double sumPrixByClientId(@Param("clientId") Long clientId);
}