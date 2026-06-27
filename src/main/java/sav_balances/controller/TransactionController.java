package sav_balances.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Intervention;
import sav_balances.entity.Transaction;
import sav_balances.service.TransactionService;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    // Récupérer les transactions d'une intervention
    @GetMapping("/intervention/{interventionId}")
    public ResponseEntity<List<Transaction>> getTransactionsByIntervention(@PathVariable Long interventionId) {
        List<Transaction> transactions = transactionService.getTransactionsByIntervention(interventionId);
        return ResponseEntity.ok(transactions);
    }

    // ✅ AJOUTER CETTE MÉTHODE POUR AJOUTER UN PAIEMENT
    @PostMapping("/intervention/{interventionId}")
    public ResponseEntity<?> ajouterPaiement(
            @PathVariable Long interventionId,
            @RequestBody Transaction transaction) {
        try {
            // Validation basique
            if (transaction.getMontant() == null || transaction.getMontant() <= 0) {
                return ResponseEntity.badRequest().body("Le montant doit être supérieur à 0");
            }
            if (transaction.getMethode() == null) {
                return ResponseEntity.badRequest().body("La méthode de paiement est obligatoire");
            }

            // Appel au service
            Transaction saved = transactionService.ajouterPaiementManuel(interventionId, transaction);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Mettre à jour la date d'intervention (paiement automatique)
    @PostMapping("/intervention/{interventionId}/date")
    public ResponseEntity<?> updateDateIntervention(
            @PathVariable Long interventionId,
            @RequestParam String dateOrdre) {
        try {
            if (dateOrdre == null || dateOrdre.isEmpty()) {
                return ResponseEntity.badRequest().body("La date d'intervention est obligatoire");
            }
            LocalDateTime date = LocalDateTime.parse(dateOrdre);
            Intervention updated = transactionService.mettreAJourDateIntervention(interventionId, date);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    // Récupérer les transactions par client
    @GetMapping("/client/{societe}")
    public ResponseEntity<List<Transaction>> getByClient(@PathVariable String societe) {
        List<Transaction> transactions = transactionService.getByClientSociete(societe);
        return ResponseEntity.ok(transactions);
    }
}