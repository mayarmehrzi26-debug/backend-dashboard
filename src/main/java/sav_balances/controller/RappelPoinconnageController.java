package sav_balances.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Intervention;
import sav_balances.entity.RappelPoinconnage;
import sav_balances.repository.InterventionRepository;
import sav_balances.repository.RappelPoinconnageRepository;
import sav_balances.service.RappelPoinconnageService;

@RestController
@RequestMapping("/api/rappels")
@CrossOrigin(origins = "http://localhost:4200")
public class RappelPoinconnageController {
    
    @Autowired
    private RappelPoinconnageService rappelService;
    
    @Autowired
    private InterventionRepository interventionRepository;  // ← AJOUTER
    
    @Autowired
    private RappelPoinconnageRepository rappelRepository;  // ← AJOUTER
    
    /**
     * Crée un rappel pour une intervention spécifique
     */
    @PostMapping("/intervention/{id}")
    public ResponseEntity<?> creerRappel(@PathVariable Long id) {
        try {
            RappelPoinconnage rappel = rappelService.creerRappel(id);
            if (rappel == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Impossible de créer le rappel. Vérifiez que l'intervention est un poinçonnage et qu'elle a une date d'intervention."
                ));
            }
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Rappel créé avec succès",
                "data", rappel
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur lors de la création du rappel: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Génère tous les rappels pour les interventions de poinçonnage
     */
    @PostMapping("/generer")
    public ResponseEntity<?> genererTousLesRappels() {
        try {
            int count = rappelService.creerRappelsPourTous();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", count + " rappels générés avec succès",
                "count", count
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur lors de la génération des rappels: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Récupère les rappels imminents (dans les 30 jours)
     */
    @GetMapping("/imminents")
    public ResponseEntity<?> getRappelsImminents() {
        try {
            List<RappelPoinconnage> rappels = rappelService.getRappelsImminents();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", rappels,
                "count", rappels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Récupère tous les rappels actifs
     */
    @GetMapping("/actifs")
    public ResponseEntity<?> getRappelsActifs() {
        try {
            List<RappelPoinconnage> rappels = rappelService.getRappelsActifs();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", rappels,
                "count", rappels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Récupère les rappels expirés
     */
    @GetMapping("/expires")
    public ResponseEntity<?> getRappelsExpires() {
        try {
            List<RappelPoinconnage> rappels = rappelService.getRappelsExpires();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", rappels,
                "count", rappels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Récupère les rappels à notifier
     */
    @GetMapping("/notifier")
    public ResponseEntity<?> getRappelsANotifier() {
        try {
            List<RappelPoinconnage> rappels = rappelService.getRappelsANotifier();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", rappels,
                "count", rappels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Marque un rappel comme notifié
     */
    @PostMapping("/{id}/notifie")
    public ResponseEntity<?> marquerNotifie(@PathVariable Long id) {
        try {
            rappelService.marquerNotifie(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Rappel marqué comme notifié"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Récupère les rappels d'un client par sa société
     */
    @GetMapping("/client/{societe}")
    public ResponseEntity<?> getRappelsByClient(@PathVariable String societe) {
        try {
            List<RappelPoinconnage> rappels = rappelService.getRappelsByClient(societe);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", rappels,
                "count", rappels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Test pour diagnostiquer les problèmes de rappels
     */
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        System.out.println("🔍 ========== TEST RAPPELS ==========");
        System.out.println("🔍 Recherche des interventions de poinçonnage...");
        
        try {
            List<Intervention> interventions = interventionRepository.findAll();
            int total = interventions.size();
            int poinconnage = 0;
            int sansDate = 0;
            int avecRappel = 0;
            int sansRappel = 0;
            
            System.out.println("📊 Total interventions trouvées: " + total);
            System.out.println("─────────────────────────────────────────");
            
            for (Intervention i : interventions) {
                String reclamation = i.getReclamation() != null ? i.getReclamation() : "";
                System.out.println("📋 [" + i.getId() + "] " + i.getNumeroOrdre() + 
                                  " | Réclamation: '" + reclamation + "'" +
                                  " | Type: " + i.getType() +
                                  " | DateOrdre: " + i.getDateOrdre());
                
                boolean estPoinconnage = reclamation.toLowerCase().contains("poinçonnage") || 
                                        reclamation.toLowerCase().contains("poinconnage") ||
                                        reclamation.toLowerCase().contains("poinçonnage périodique") ||
                                        reclamation.toLowerCase().contains("poinconnage périodique");
                
                if (estPoinconnage) {
                    poinconnage++;
                    System.out.println("  ✅ Poinçonnage trouvé: " + i.getNumeroOrdre());
                    
                    if (i.getDateOrdre() == null) {
                        sansDate++;
                        System.out.println("  ⚠️ Pas de date d'intervention pour: " + i.getNumeroOrdre());
                    } else {
                        System.out.println("  📅 Date d'intervention: " + i.getDateOrdre());
                        System.out.println("  📆 Prochain poinçonnage: " + i.getDateOrdre().plusMonths(12));
                    }
                    
                    // Vérifier si un rappel existe
                    RappelPoinconnage rappel = rappelRepository.findByInterventionId(i.getId());
                    if (rappel != null) {
                        avecRappel++;
                        System.out.println("  📌 Rappel existant: ID=" + rappel.getId() + 
                                          " | Jours restants: " + rappel.getJoursRestants() +
                                          " | Statut: " + rappel.getStatut());
                    } else {
                        sansRappel++;
                        System.out.println("  ❌ Aucun rappel existant pour cette intervention");
                    }
                }
                System.out.println("─────────────────────────────────────────");
            }
            
            System.out.println("📊 RÉSULTATS:");
            System.out.println("  - Total interventions: " + total);
            System.out.println("  - Interventions de poinçonnage: " + poinconnage);
            System.out.println("  - Poinçonnages sans date: " + sansDate);
            System.out.println("  - Poinçonnages avec rappel: " + avecRappel);
            System.out.println("  - Poinçonnages sans rappel: " + sansRappel);
            System.out.println("🔍 ========== FIN TEST ==========");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "total", total,
                "poinconnage", poinconnage,
                "sansDate", sansDate,
                "avecRappel", avecRappel,
                "sansRappel", sansRappel,
                "message", "Test terminé - Voir la console pour plus de détails"
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur lors du test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur lors du test: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Supprime tous les rappels
     */
    @DeleteMapping("/all")
    public ResponseEntity<?> supprimerTousLesRappels() {
        try {
            rappelRepository.deleteAll();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tous les rappels ont été supprimés"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur lors de la suppression: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Supprime un rappel spécifique
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerRappel(@PathVariable Long id) {
        try {
            if (rappelRepository.existsById(id)) {
                rappelRepository.deleteById(id);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Rappel supprimé avec succès"
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur lors de la suppression: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Récupère un rappel par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRappelById(@PathVariable Long id) {
        try {
            RappelPoinconnage rappel = rappelService.getRappelById(id);
            if (rappel != null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", rappel
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
}