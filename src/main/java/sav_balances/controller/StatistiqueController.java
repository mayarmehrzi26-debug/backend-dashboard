package sav_balances.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import sav_balances.service.BalanceService;
import sav_balances.service.ClientService;
import sav_balances.service.InterventionService;

@RestController
@RequestMapping("/api/stats")
public class StatistiqueController {

    @Autowired
    private BalanceService balanceService;
    
    @Autowired
    private ClientService clientService;
    
    @Autowired
    private InterventionService interventionService;
    
    @GetMapping("/client/{clientId}")
    public Map<String, Object> getClientStats(@PathVariable Long clientId) {
        Map<String, Object> stats = new HashMap<>();
       
        stats.put("client", clientService.getClientById(clientId));
        return stats;
    }
    
    @GetMapping("/global")
    public Map<String, Object> getGlobalStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClients", clientService.getAllClients().size());
        stats.put("totalInterventions", interventionService.getAll().size());
        stats.put("totalBalances", balanceService.getAllBalances().size());
        return stats;
    }
}