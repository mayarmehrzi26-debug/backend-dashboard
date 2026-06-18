package sav_balances.service;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import sav_balances.dto.FormulaireInterventionDTO;
import sav_balances.entity.Balance;
import sav_balances.entity.Intervention;
import sav_balances.repository.BalanceRepository;

@Service
public class FormulaireService {

    @Autowired
    private InterventionService interventionService;
    
    @Autowired
    private BalanceService balanceService;
    
    @Autowired
    private BalanceRepository balanceRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public FormulaireInterventionDTO getFormulaireByInterventionId(Long interventionId) {
        Intervention intervention = interventionService.getById(interventionId);
        if (intervention == null) return null;
        
        FormulaireInterventionDTO dto = new FormulaireInterventionDTO();
        dto.setId(intervention.getId());
        dto.setNumeroOrdre(intervention.getNumeroOrdre());
        dto.setSociete(intervention.getSociete());
        dto.setBascule(intervention.getBascule());
        dto.setResponsable(intervention.getResponsable());
        dto.setAdresse(intervention.getAdresse());
        dto.setTelephone(intervention.getTelephone());
        dto.setEmail(intervention.getEmail());
        dto.setReclamation(intervention.getReclamation());
        dto.setTechnicien(intervention.getTechnicien());
        dto.setDateReclamation(intervention.getDateReclamation());
        dto.setDateOrdre(intervention.getDateOrdre());
        dto.setRapportIntervention(intervention.getRapportIntervention());
        
        // Calcul des montants
        List<Balance> balances = balanceRepository.findByInterventionId(interventionId);
        Double montantTotal = balances.stream()
            .mapToDouble(Balance::getPrix)
            .sum();
        dto.setMontantTotal(montantTotal);
        
        return dto;
    }
    
    public String genererTexteFormulaire(Long interventionId) {
        FormulaireInterventionDTO formulaire = getFormulaireByInterventionId(interventionId);
        if (formulaire == null) return "Intervention non trouvée";
        
        StringBuilder sb = new StringBuilder();
        sb.append("STE BALANCE NAFIS\n\n");
        sb.append("Ordre d'intervention N : ").append(formulaire.getNumeroOrdre()).append("\n\n");
        sb.append("FORMULAIRE\n\n");
        sb.append("┌─────────────────────────────────────────────────────────────┐\n");
        sb.append(String.format("│ SOCIÉTÉ : %-40s │\n", 
            truncate(formulaire.getSociete(), 40)));
        sb.append(String.format("│ BASQUE : %-42s │\n", 
            truncate(formulaire.getBascule(), 42)));
        sb.append(String.format("│ NOM RESPONSABLE : %-34s │\n", 
            truncate(formulaire.getResponsable(), 34)));
        sb.append(String.format("│ ADRESSE : %-41s │\n", 
            truncate(formulaire.getAdresse(), 41)));
        sb.append(String.format("│ TÉLÉPHONE : %-39s │\n", 
            truncate(formulaire.getTelephone(), 39)));
        sb.append(String.format("│ EMAIL : %-43s │\n", 
            truncate(formulaire.getEmail() != null ? formulaire.getEmail() : "", 43)));
        sb.append("├─────────────────────────────────────────────────────────────┤\n");
        sb.append(String.format("│ RÉFÉRENCE : %-39s │\n", "3030"));
        sb.append(String.format("│ DATE DE RÉCLAMATION : %-29s │\n", 
            formulaire.getDateReclamation() != null ? 
            formulaire.getDateReclamation().format(DATE_FORMATTER) : ""));
        sb.append(String.format("│ NOM TECHNIQUE : %-35s │\n", 
            truncate(formulaire.getTechnicien(), 35)));
        sb.append(String.format("│ DATE DE COURRIE : %-33s │\n", 
            formulaire.getDateOrdre() != null ? 
            formulaire.getDateOrdre().format(DATE_FORMATTER) : ""));
        sb.append("├─────────────────────────────────────────────────────────────┤\n");
        sb.append(String.format("│ RÉCLAMATION : %-37s │\n", 
            truncate(formulaire.getReclamation(), 37)));
        sb.append("├─────────────────────────────────────────────────────────────┤\n");
        sb.append("│ RELEVE DE L'INTERVENTION                                     │\n");
        sb.append("├─────────────────────────────────────────────────────────────┤\n");
        sb.append("│ Cochez Soinier                                               │\n");
        sb.append("├─────────────────────────────────────────────────────────────┤\n");
        sb.append("│ ZONE A REMPLIR PAR LE CLIENT :                               │\n");
        sb.append("│                                                             │\n");
        sb.append("│ Voir et/ou remplir pour information                          │\n");
        sb.append("│                                                             │\n");
        sb.append("│                                                             │\n");
        sb.append("│                                                             │\n");
        sb.append("│ Cachet et signature                                          │\n");
        sb.append("└─────────────────────────────────────────────────────────────┘\n\n");
        sb.append("Le Président est invité à nous permettre de suivre cette procédure ");
        sb.append("d'exécution et de nous assurer que notre administration est validée ");
        sb.append("et efficace. Cette procédure est destinée à garantir la sécurité ");
        sb.append("et la protection des données à caractère personnel. Ce document ");
        sb.append("est également disponible sur notre site internet.\n\n");
        sb.append(formulaire.getDateOrdre() != null ? 
            formulaire.getDateOrdre().format(DateTimeFormatter.ofPattern("EEEE dd MMMM")) : "");
        
        return sb.toString();
    }
    
    private String truncate(String str, int maxLength) {
        if (str == null) return "";
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength - 3) + "...";
    }
}