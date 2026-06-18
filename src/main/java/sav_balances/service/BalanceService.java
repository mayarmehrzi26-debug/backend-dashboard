package sav_balances.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import sav_balances.entity.Balance;
import sav_balances.repository.BalanceRepository;

@Service
public class BalanceService {

    @Autowired
    private BalanceRepository balanceRepository;

    public List<Balance> getAllBalances() {
        return balanceRepository.findAll();
    }

    public Balance getBalanceById(Long id) {
        return balanceRepository.findById(id).orElse(null);
    }

    public Balance saveBalance(Balance balance) {
        if (balance.getDateOperation() == null) {
            balance.setDateOperation(java.time.LocalDateTime.now());
        }
        return balanceRepository.save(balance);
    }

    public void deleteBalance(Long id) {
        balanceRepository.deleteById(id);
    }

    public List<Balance> getBalancesByClientId(Long clientId) {
        return balanceRepository.findByClientId(clientId);
    }

    public List<Balance> getBalancesByInterventionId(Long interventionId) {
        return balanceRepository.findByInterventionId(interventionId);
    }

    public List<Balance> getBalancesByReference(String reference) {
        return balanceRepository.findByReferenceContaining(reference);
    }

    public List<Balance> getBalancesByCategorie(String categorie) {
        return balanceRepository.findByCategorie(categorie);
    }

    // Changé de montant à prix
    public Double getTotalPrixClient(Long clientId) {
        Double total = balanceRepository.sumPrixByClientId(clientId);
        return total != null ? total : 0.0;
    }
}