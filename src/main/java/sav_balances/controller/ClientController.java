package sav_balances.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Client;
import sav_balances.service.ClientService;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "http://localhost:4200")

public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }
    
    @GetMapping("/{id}")
    public Client getClientById(@PathVariable Long id) {
        return clientService.getClientById(id);
    }
    
    @PostMapping
    public Client addClient(@RequestBody Client client) {
        return clientService.saveClient(client);
    }
    
    // PUT pour mise à jour complète
    @PutMapping("/{id}")
    public Client updateClient(@PathVariable Long id, @RequestBody Client client) {
        return clientService.updateClient(id, client);
    }
    
    // PATCH pour mise à jour partielle (recommandé pour l'évaluation)
    @PatchMapping("/{id}")
    public Client patchClient(@PathVariable Long id, @RequestBody Client client) {
        return clientService.patchClient(id, client);
    }
    
    @DeleteMapping("/{id}")
    public void deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
    }
    
    // Endpoint spécifique pour l'évaluation
    @PutMapping("/{id}/evaluation")
    public Client updateEvaluation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> evaluation) {
        
        String notes = (String) evaluation.get("notes");
        String comportement = (String) evaluation.get("comportement");
        Integer note = evaluation.get("note") != null ? ((Number) evaluation.get("note")).intValue() : null;
        String statutPaiement = (String) evaluation.get("statutPaiement");
        Boolean negociateur = (Boolean) evaluation.get("negociateur");
        Boolean clientFidele = (Boolean) evaluation.get("clientFidele");
        
        return clientService.updateEvaluation(id, notes, comportement, note, 
                                               statutPaiement, negociateur, clientFidele);
    }
    
    @PostMapping("/{id}/warnings")
    public Client addWarning(@PathVariable Long id) {
        return clientService.addWarning(id);
    }
    
    @PostMapping("/{id}/history")
    public Client addNoteToHistory(@PathVariable Long id, @RequestBody String note) {
        return clientService.addNoteToHistory(id, note);
    }
    
    @GetMapping("/comportement/{comportement}")
    public List<Client> getByComportement(@PathVariable String comportement) {
        return clientService.getClientsByComportement(comportement);
    }
    
    @GetMapping("/warnings")
    public List<Client> getClientsWithWarnings() {
        return clientService.getClientsWithWarnings();
    }
    
    @GetMapping("/paiement/{statut}")
    public List<Client> getByStatutPaiement(@PathVariable String statut) {
        return clientService.getClientsByStatutPaiement(statut);
    }
    
    @GetMapping("/negociateurs")
    public List<Client> getNegociateurs() {
        return clientService.getClientsByNegociateur();
    }
    
    @GetMapping("/fideles")
    public List<Client> getFideles() {
        return clientService.getClientsByFidele();
    }
    
    @GetMapping("/top-rated")
    public List<Client> getTopRatedClients() {
        return clientService.getTopRatedClients();
    }
}