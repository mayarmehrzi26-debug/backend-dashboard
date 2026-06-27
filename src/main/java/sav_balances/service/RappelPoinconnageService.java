package sav_balances.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import sav_balances.entity.Intervention;
import sav_balances.entity.RappelPoinconnage;
import sav_balances.repository.InterventionRepository;
import sav_balances.repository.RappelPoinconnageRepository;

@Service
public class RappelPoinconnageService {
    
    @Autowired
    private RappelPoinconnageRepository rappelRepository;
    
    @Autowired
    private InterventionRepository interventionRepository;
    
    private static final int DELAI_RAPPEL = 30;
    
    @PostConstruct
    public void init() {
        System.out.println("🔄 Génération automatique des rappels de poinçonnage...");
        creerRappelsPourTous();
        System.out.println("✅ Rappels générés avec succès !");
    }
    
    public RappelPoinconnage creerRappel(Long interventionId) {
        Intervention intervention = interventionRepository.findById(interventionId).orElse(null);
        if (intervention == null) {
            System.out.println("❌ Intervention non trouvée: " + interventionId);
            return null;
        }
        
        // ✅ Vérifier si c'est un poinçonnage (insensible à la casse, avec ou sans accent)
        String reclamation = intervention.getReclamation() != null 
            ? intervention.getReclamation().toLowerCase().trim() 
            : "";
            
        boolean estPoinconnage = reclamation.contains("poinçonnage") || 
                                 reclamation.contains("poinconnage") ||
                                 reclamation.contains("poinçonnage périodique") ||
                                 reclamation.contains("poinconnage périodique");
        
        if (!estPoinconnage) {
            System.out.println("⏭️ Pas un poinçonnage: " + reclamation);
            return null;
        }
        
        LocalDateTime dateIntervention = intervention.getDateOrdre();
        if (dateIntervention == null) {
            System.out.println("❌ Pas de date d'intervention pour: " + intervention.getNumeroOrdre());
            return null;
        }
        
        LocalDateTime dateProchainPoinconnage = dateIntervention.plusMonths(12);
        LocalDateTime now = LocalDateTime.now();
        
        long joursRestants = ChronoUnit.DAYS.between(now, dateProchainPoinconnage);
        
        // Vérifier si un rappel existe déjà
        RappelPoinconnage existing = rappelRepository.findByInterventionId(interventionId);
        if (existing != null) {
            System.out.println("🔄 Mise à jour du rappel existant pour: " + intervention.getNumeroOrdre());
            existing.setJoursRestants((int) joursRestants);
            existing.setStatut(joursRestants <= DELAI_RAPPEL ? "EN_COURS" : "ACTIF");
            existing.setDateProchainPoinconnage(dateProchainPoinconnage);
            return rappelRepository.save(existing);
        }
        
        RappelPoinconnage rappel = new RappelPoinconnage();
        rappel.setIntervention(intervention);
        rappel.setNumeroOrdre(intervention.getNumeroOrdre());
        rappel.setSociete(intervention.getSociete());
        rappel.setEquipement(intervention.getBascule());
        rappel.setReference(intervention.getReference());
        rappel.setResponsable(intervention.getResponsable());
        rappel.setTelephone(intervention.getTelephone());
        rappel.setEmail(intervention.getEmail());
        rappel.setDateDernierPoinconnage(dateIntervention);
        rappel.setDateProchainPoinconnage(dateProchainPoinconnage);
        rappel.setJoursRestants((int) joursRestants);
        rappel.setStatut(joursRestants <= DELAI_RAPPEL ? "EN_COURS" : "ACTIF");
        rappel.setNotifie(false);
        rappel.setDateCreation(LocalDateTime.now());
        
        System.out.println("✅ Nouveau rappel créé pour: " + intervention.getNumeroOrdre() + 
                          " - Prochain poinçonnage: " + dateProchainPoinconnage + 
                          " - Jours restants: " + joursRestants);
        
        return rappelRepository.save(rappel);
    }
    
   public int creerRappelsPourTous() {
    System.out.println("🔍 Recherche des interventions de poinçonnage...");
    
    List<Intervention> interventions = interventionRepository.findAll();
    System.out.println("📊 Total interventions trouvées: " + interventions.size());
    
    int count = 0;
    for (Intervention intervention : interventions) {
        String reclamation = intervention.getReclamation() != null 
            ? intervention.getReclamation().toLowerCase().trim() 
            : "";
            
        boolean estPoinconnage = reclamation.contains("poinçonnage") || 
                                 reclamation.contains("poinconnage") ||
                                 reclamation.contains("poinçonnage périodique") ||
                                 reclamation.contains("poinconnage périodique");
        
        if (estPoinconnage) {
            System.out.println("🔧 Poinçonnage trouvé: " + intervention.getNumeroOrdre());
            RappelPoinconnage rappel = creerRappel(intervention.getId());
            if (rappel != null) {
                count++;
            }
        }
    }
    System.out.println("✅ " + count + " rappels générés/mis à jour");
    return count;
}
    
    /**
     * Récupère les rappels imminents (dans les 30 jours)
     */
    public List<RappelPoinconnage> getRappelsImminents() {
        return rappelRepository.findRappelsImminents(DELAI_RAPPEL);
    }
    
    /**
     * Récupère tous les rappels actifs
     */
    public List<RappelPoinconnage> getRappelsActifs() {
        return rappelRepository.findRappelsActifs();
    }
    
    /**
     * Récupère les rappels expirés
     */
    public List<RappelPoinconnage> getRappelsExpires() {
        return rappelRepository.findRappelsExpires(LocalDateTime.now());
    }
    
    /**
     * Récupère les rappels à notifier
     */
    public List<RappelPoinconnage> getRappelsANotifier() {
        return rappelRepository.findRappelsANotifier(15);
    }
    
    /**
     * Marque un rappel comme notifié
     */
    public void marquerNotifie(Long id) {
        rappelRepository.findById(id).ifPresent(rappel -> {
            rappel.setNotifie(true);
            rappel.setDateNotification(LocalDateTime.now());
            rappelRepository.save(rappel);
        });
    }
    
    /**
     * Récupère les rappels d'un client
     */
    public List<RappelPoinconnage> getRappelsByClient(String societe) {
        return rappelRepository.findBySociete(societe);
    }
    public RappelPoinconnage getRappelById(Long id) {
        return rappelRepository.findById(id).orElse(null);
    }

    
    
}