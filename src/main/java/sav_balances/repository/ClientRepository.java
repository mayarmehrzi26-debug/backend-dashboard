package sav_balances.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import sav_balances.entity.Client;

public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByTelephone(String telephone);
    Optional<Client> findBySociete(String societe);
    
    @Query("SELECT c FROM Client c WHERE c.societe LIKE %:keyword% OR c.responsable LIKE %:keyword%")
    List<Client> searchByKeyword(@Param("keyword") String keyword);
    
    // ===== NOUVELLES MÉTHODES =====
    
    // Rechercher par comportement
    List<Client> findByComportement(String comportement);
    
    // Rechercher par statut de paiement
    List<Client> findByStatutPaiement(String statutPaiement);
    
    // Rechercher les clients avec note >= 4
    List<Client> findByNoteGreaterThanEqual(Integer note);
    
    // Rechercher les clients avec note <= 2
    List<Client> findByNoteLessThanEqual(Integer note);
    
    // Rechercher les négociateurs
    List<Client> findByNegociateurTrue();
    
    // Rechercher les clients fidèles
    List<Client> findByClientFideleTrue();
    
    // Rechercher les clients avec avertissements
    @Query("SELECT c FROM Client c WHERE c.nombreAvertissements > 0 ORDER BY c.nombreAvertissements DESC")
    List<Client> findClientsWithWarnings();
    
    // Rechercher les clients par note moyenne
    @Query("SELECT c FROM Client c WHERE c.note IS NOT NULL ORDER BY c.note DESC")
    List<Client> findTopRatedClients();
    
    // Compter par comportement
    @Query("SELECT c.comportement, COUNT(c) FROM Client c GROUP BY c.comportement")
    List<Object[]> countByComportement();
}