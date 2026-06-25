// sav_balances/service/ClientService.java
package sav_balances.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import sav_balances.entity.Client;
import sav_balances.entity.Transaction;
import sav_balances.repository.ClientRepository;
import sav_balances.repository.TransactionRepository;
import sav_balances.dto.ClientWalletDTO;
import sav_balances.dto.TransactionDTO;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Client saveClient(Client client) {
        if (client.getNombreAvertissements() == null) {
            client.setNombreAvertissements(0);
        }
        if (client.getNegociateur() == null) {
            client.setNegociateur(false);
        }
        if (client.getClientFidele() == null) {
            client.setClientFidele(false);
        }
        if (client.getDernierContact() == null) {
            client.setDernierContact(LocalDateTime.now());
        }
        return clientRepository.save(client);
    }
    
    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }
    
    public Client getClientById(Long id) {
        return clientRepository.findById(id).orElse(null);
    }
    
    // Mise à jour complète
    public Client updateClient(Long id, Client newClient) {
        return clientRepository.findById(id).map(client -> {
            // Mettre à jour uniquement les champs non null
            if (newClient.getSociete() != null) {
                client.setSociete(newClient.getSociete());
            }
            if (newClient.getResponsable() != null) {
                client.setResponsable(newClient.getResponsable());
            }
            if (newClient.getTelephone() != null) {
                client.setTelephone(newClient.getTelephone());
            }
            if (newClient.getAdresse() != null) {
                client.setAdresse(newClient.getAdresse());
            }
            if (newClient.getEmail() != null) {
                client.setEmail(newClient.getEmail());
            }
            if (newClient.getNotes() != null) {
                client.setNotes(newClient.getNotes());
            }
            if (newClient.getComportement() != null) {
                client.setComportement(newClient.getComportement());
            }
            if (newClient.getNote() != null) {
                client.setNote(newClient.getNote());
            }
            if (newClient.getStatutPaiement() != null) {
                client.setStatutPaiement(newClient.getStatutPaiement());
            }
            if (newClient.getNegociateur() != null) {
                client.setNegociateur(newClient.getNegociateur());
            }
            if (newClient.getClientFidele() != null) {
                client.setClientFidele(newClient.getClientFidele());
            }
            if (newClient.getNombreAvertissements() != null) {
                client.setNombreAvertissements(newClient.getNombreAvertissements());
            }
            if (newClient.getDernierContact() != null) {
                client.setDernierContact(newClient.getDernierContact());
            }
            if (newClient.getHistoriqueNotes() != null) {
                client.setHistoriqueNotes(newClient.getHistoriqueNotes());
            }
            
            client.setDernierContact(LocalDateTime.now());
            
            return clientRepository.save(client);
        }).orElse(null);
    }
    
    // Nouvelle méthode pour mise à jour partielle (PATCH)
    public Client patchClient(Long id, Client updates) {
        return clientRepository.findById(id).map(client -> {
            // Mettre à jour uniquement les champs présents dans updates
            if (updates.getSociete() != null) {
                client.setSociete(updates.getSociete());
            }
            if (updates.getResponsable() != null) {
                client.setResponsable(updates.getResponsable());
            }
            if (updates.getTelephone() != null) {
                client.setTelephone(updates.getTelephone());
            }
            if (updates.getAdresse() != null) {
                client.setAdresse(updates.getAdresse());
            }
            if (updates.getEmail() != null) {
                client.setEmail(updates.getEmail());
            }
            if (updates.getNotes() != null) {
                client.setNotes(updates.getNotes());
            }
            if (updates.getComportement() != null) {
                client.setComportement(updates.getComportement());
            }
            if (updates.getNote() != null) {
                client.setNote(updates.getNote());
            }
            if (updates.getStatutPaiement() != null) {
                client.setStatutPaiement(updates.getStatutPaiement());
            }
            if (updates.getNegociateur() != null) {
                client.setNegociateur(updates.getNegociateur());
            }
            if (updates.getClientFidele() != null) {
                client.setClientFidele(updates.getClientFidele());
            }
            if (updates.getNombreAvertissements() != null) {
                client.setNombreAvertissements(updates.getNombreAvertissements());
            }
            if (updates.getDernierContact() != null) {
                client.setDernierContact(updates.getDernierContact());
            }
            if (updates.getHistoriqueNotes() != null) {
                client.setHistoriqueNotes(updates.getHistoriqueNotes());
            }
            
            client.setDernierContact(LocalDateTime.now());
            
            return clientRepository.save(client);
        }).orElse(null);
    }
    
    // Méthode spécifique pour mettre à jour uniquement l'évaluation
    public Client updateEvaluation(Long id, String notes, String comportement, Integer note, 
                                   String statutPaiement, Boolean negociateur, Boolean clientFidele) {
        return clientRepository.findById(id).map(client -> {
            if (notes != null) client.setNotes(notes);
            if (comportement != null) client.setComportement(comportement);
            if (note != null) client.setNote(note);
            if (statutPaiement != null) client.setStatutPaiement(statutPaiement);
            if (negociateur != null) client.setNegociateur(negociateur);
            if (clientFidele != null) client.setClientFidele(clientFidele);
            
            client.setDernierContact(LocalDateTime.now());
            
            // Ajouter à l'historique
            String historique = client.getHistoriqueNotes() != null ? client.getHistoriqueNotes() : "";
            String newEntry = LocalDateTime.now() + " - 📝 Évaluation mise à jour\n";
            client.setHistoriqueNotes(historique + newEntry);
            
            return clientRepository.save(client);
        }).orElse(null);
    }
    
    // Ajouter un avertissement
    public Client addWarning(Long id) {
        return clientRepository.findById(id).map(client -> {
            int currentWarnings = client.getNombreAvertissements() != null ? client.getNombreAvertissements() : 0;
            client.setNombreAvertissements(currentWarnings + 1);
            
            String historique = client.getHistoriqueNotes() != null ? client.getHistoriqueNotes() : "";
            String newWarning = LocalDateTime.now() + " - ⚠️ Avertissement ajouté\n";
            client.setHistoriqueNotes(historique + newWarning);
            
            return clientRepository.save(client);
        }).orElse(null);
    }
    
    // Ajouter une note à l'historique
    public Client addNoteToHistory(Long id, String note) {
        return clientRepository.findById(id).map(client -> {
            String historique = client.getHistoriqueNotes() != null ? client.getHistoriqueNotes() : "";
            String newNote = LocalDateTime.now() + " - 📝 " + note + "\n";
            client.setHistoriqueNotes(historique + newNote);
            client.setDernierContact(LocalDateTime.now());
            return clientRepository.save(client);
        }).orElse(null);
    }
    
    // Rechercher les clients par comportement
    public List<Client> getClientsByComportement(String comportement) {
        return clientRepository.findByComportement(comportement);
    }
    
    // Rechercher les clients avec avertissements
    public List<Client> getClientsWithWarnings() {
        return clientRepository.findClientsWithWarnings();
    }
    
    // Rechercher les clients par statut de paiement
    public List<Client> getClientsByStatutPaiement(String statutPaiement) {
        return clientRepository.findByStatutPaiement(statutPaiement);
    }
    
    public List<Client> getClientsByNegociateur() {
        return clientRepository.findByNegociateurTrue();
    }
    
    public List<Client> getClientsByFidele() {
        return clientRepository.findByClientFideleTrue();
    }
    
    public List<Client> getTopRatedClients() {
        return clientRepository.findTopRatedClients();
    }

    // ==================== NOUVELLES MÉTHODES PORTEFEUILLE ====================
    
    /**
     * Récupère les statistiques du portefeuille d'un client
     */
    public Map<String, Object> getClientWalletStats(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'id: " + clientId));
        
        List<Transaction> transactions = transactionRepository.findByInterventionSociete(client.getSociete());
        
        List<Transaction> transactionsValides = transactions.stream()
                .filter(t -> t.getStatut() == Transaction.StatutTransaction.VALIDE)
                .toList();
        
        int nombreTransactions = transactionsValides.size();
        double totalPaye = transactionsValides.stream()
                .mapToDouble(Transaction::getMontant)
                .sum();
        double montantMoyen = nombreTransactions > 0 ? totalPaye / nombreTransactions : 0;
        
        Transaction derniereTransaction = transactionsValides.stream()
                .max((t1, t2) -> t1.getDateTransaction().compareTo(t2.getDateTransaction()))
                .orElse(null);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPaye", totalPaye);
        stats.put("nombreTransactions", nombreTransactions);
        stats.put("montantMoyen", montantMoyen);
        stats.put("derniereTransaction", derniereTransaction != null ? new TransactionDTO(derniereTransaction) : null);
        
        return stats;
    }

    /**
     * Récupère les détails complets du client avec les statistiques du portefeuille
     */
    public ClientWalletDTO getClientWithWallet(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'id: " + id));
        
        List<Transaction> transactions = transactionRepository.findByInterventionSociete(client.getSociete());
        return new ClientWalletDTO(client, transactions);
    }
}