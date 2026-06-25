// sav_balances/controller/TransactionController.java
package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sav_balances.dto.TransactionDTO;
import sav_balances.entity.Transaction;
import sav_balances.service.TransactionService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/intervention/{interventionId}")
    public ResponseEntity<?> ajouterPaiement(
            @PathVariable Long interventionId,
            @RequestBody Transaction transaction) {
        try {
            Transaction saved = transactionService.ajouterPaiement(interventionId, transaction);
            return ResponseEntity.ok(new TransactionDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/intervention/{interventionId}")
    public ResponseEntity<?> getTransactionsByIntervention(@PathVariable Long interventionId) {
        try {
            List<Transaction> transactions = transactionService.getTransactionsByIntervention(interventionId);
            List<TransactionDTO> dtos = transactions.stream()
                    .map(TransactionDTO::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/client/{societe}")
    public ResponseEntity<?> getTransactionsByClient(@PathVariable String societe) {
        try {
            List<Transaction> transactions = transactionService.getByClientSociete(societe);
            List<TransactionDTO> dtos = transactions.stream()
                    .map(TransactionDTO::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<?> annulerTransaction(@PathVariable Long transactionId) {
        try {
            transactionService.annulerTransaction(transactionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}