package sav_balances.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Balance;
import sav_balances.service.BalanceService;

@RestController
@RequestMapping("/api/balances")
@CrossOrigin(origins = "http://localhost:4200")
public class BalanceController {

    @Autowired
    private BalanceService balanceService;

    @GetMapping
    public List<Balance> getAllBalances() {
        return balanceService.getAllBalances();
    }

    @GetMapping("/{id}")
    public Balance getBalanceById(@PathVariable Long id) {
        return balanceService.getBalanceById(id);
    }

    @GetMapping("/client/{clientId}")
    public List<Balance> getBalancesByClient(@PathVariable Long clientId) {
        return balanceService.getBalancesByClientId(clientId);
    }

    @GetMapping("/reference/{reference}")
    public List<Balance> getBalancesByReference(@PathVariable String reference) {
        return balanceService.getBalancesByReference(reference);
    }

    @GetMapping("/categorie/{categorie}")
    public List<Balance> getBalancesByCategorie(@PathVariable String categorie) {
        return balanceService.getBalancesByCategorie(categorie);
    }

    @GetMapping("/client/{clientId}/total")
    public Double getTotalPrixClient(@PathVariable Long clientId) {
        return balanceService.getTotalPrixClient(clientId);
    }

    @PostMapping
    public Balance createBalance(@RequestBody Balance balance) {
        return balanceService.saveBalance(balance);
    }

    @PutMapping("/{id}")
    public Balance updateBalance(@PathVariable Long id, @RequestBody Balance balance) {
        balance.setId(id);
        return balanceService.saveBalance(balance);
    }

    @DeleteMapping("/{id}")
    public void deleteBalance(@PathVariable Long id) {
        balanceService.deleteBalance(id);
    }
}