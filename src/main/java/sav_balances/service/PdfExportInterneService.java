package sav_balances.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.awt.Color;
import java.io.InputStream;

@Service
public class PdfExportInterneService {

    private static final Color COLOR_PRIMARY = new Color(13, 62, 35);
    private static final Color COLOR_SECONDARY = new Color(26, 92, 56);
    private static final Color COLOR_BG_SECTION = new Color(235, 245, 238);

    // MÉTHODE MODIFIÉE - Ajout du paramètre reference
    public byte[] generateFormulaireInternePdf(String numeroOrdre, String equipement,
                                                String reference,  // ← NOUVEAU PARAMÈTRE
                                                String technicien, String dateIntervention,
                                                String reclamation,
                                                String rapportIntervention) {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        document.setMargins(30, 30, 20, 20);  
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            Font companyFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_PRIMARY);
            Font detailsHeaderFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.DARK_GRAY);
            Font subTitleFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_SECONDARY);
            Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_SECONDARY);
            Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 8, Font.NORMAL);
            Font reclamationFont = new Font(Font.HELVETICA, 10, Font.ITALIC, Color.DARK_GRAY);
            Font referenceFont = new Font(Font.HELVETICA, 10, Font.ITALIC, new Color(80, 80, 80));  // ← NOUVELLE POLICE
            
            // En-tête
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{75, 25});
            
            PdfPTable leftSubTable = new PdfPTable(2);
            leftSubTable.setWidthPercentage(100);
            leftSubTable.setWidths(new float[]{65, 35});
            
            PdfPCell textCompanyCell = new PdfPCell();
            textCompanyCell.setBorder(Rectangle.NO_BORDER);
            textCompanyCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            textCompanyCell.setPadding(0);
            
            Paragraph company = new Paragraph("STE BALANCE NAFIS", companyFont);
            company.setSpacingAfter(2);
            textCompanyCell.addElement(company);
            
            Paragraph companyDetails = new Paragraph(
                "Adresse : Route principale N°1 Cité Ettamir-Sousse\n" +
                "Tél : 54 75 30 23 / 26 75 30 23 | Email : contact@balancenafis.com", 
                detailsHeaderFont
            );
            companyDetails.setLeading(10f);
            textCompanyCell.addElement(companyDetails);
            
            leftSubTable.addCell(textCompanyCell);
            
            // Logo
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            logoCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            logoCell.setPaddingTop(0);
            logoCell.setPaddingBottom(0);
            logoCell.setPaddingLeft(5);
            
            try {
                InputStream logoStream = getClass().getResourceAsStream("/static/images/logo.png");
                if (logoStream != null) {
                    Image logo = Image.getInstance(logoStream.readAllBytes());
                    logo.scaleToFit(90, 55);
                    logo.setAlignment(Element.ALIGN_LEFT);
                    logoCell.addElement(logo);
                    logoStream.close();
                }
            } catch (Exception e) {
                System.err.println("Logo non trouvé: " + e.getMessage());
            }
            leftSubTable.addCell(logoCell);
            
            PdfPCell mainLeftCell = new PdfPCell(leftSubTable);
            mainLeftCell.setBorder(Rectangle.NO_BORDER);
            mainLeftCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            mainLeftCell.setPadding(0);
            headerTable.addCell(mainLeftCell);
            
            Paragraph dateInfo = new Paragraph(
                "Généré le : " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                smallFont
            );
            PdfPCell dateCell = new PdfPCell(dateInfo);
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dateCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            dateCell.setPadding(0);
            headerTable.addCell(dateCell);
            
            document.add(headerTable);
            
            // Titre
            Paragraph title = new Paragraph("ORDRE D'INTERVENTION INTERNE N° " + numeroOrdre, subTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(20);
            title.setSpacingAfter(12);
            document.add(title);
            
            // Tableau des informations - AJOUT DE LA RÉFÉRENCE
            PdfPTable mainTable = new PdfPTable(2);
            mainTable.setWidthPercentage(100);
            mainTable.setWidths(new float[]{35, 65});
            
            addSectionTitle(mainTable, "INFORMATIONS DE L'INTERVENTION", COLOR_PRIMARY, 2);
            addRow(mainTable, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(mainTable, "Référence :", getValue(reference), labelFont, referenceFont);  // ← AJOUT RÉFÉRENCE
            addRow(mainTable, "Technicien :", getValue(technicien), labelFont, valueFont);
            addRow(mainTable, "Date d'intervention :", formatDate(dateIntervention), labelFont, valueFont);
            
            // Ligne RÉCLAMATION
            PdfPCell reclamationLabelCell = new PdfPCell(new Paragraph("RÉCLAMATION :", labelFont));
            reclamationLabelCell.setBorder(Rectangle.NO_BORDER);
            reclamationLabelCell.setPadding(3);
            reclamationLabelCell.setVerticalAlignment(Element.ALIGN_BASELINE);
            
            String reclamationText = getValue(reclamation);
            PdfPCell reclamationValueCell = new PdfPCell(new Paragraph(reclamationText, reclamationFont));
            reclamationValueCell.setBorder(Rectangle.NO_BORDER);
            reclamationValueCell.setPadding(3);
            reclamationValueCell.setBorder(Rectangle.BOTTOM);
            reclamationValueCell.setBorderWidthBottom(0.5f);
            reclamationValueCell.setVerticalAlignment(Element.ALIGN_BASELINE);
            
            mainTable.addCell(reclamationLabelCell);
            mainTable.addCell(reclamationValueCell);
            
            document.add(mainTable);
            
            // Rapport
            Paragraph rapportTitle = new Paragraph("RAPPORT D'INTERVENTION", subTitleFont);
            rapportTitle.setSpacingBefore(10);
            rapportTitle.setSpacingAfter(8);
            rapportTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(rapportTitle);
            
            PdfPTable rapportTable = new PdfPTable(1);
            rapportTable.setWidthPercentage(100);
            
            PdfPCell rapportCell = new PdfPCell();
            rapportCell.setBorder(Rectangle.BOX);
            rapportCell.setBorderWidth(1.5f);
            rapportCell.setPadding(12);
            rapportCell.setMinimumHeight(120);
            
            String rapport = rapportIntervention != null && !rapportIntervention.isEmpty() 
                            ? rapportIntervention : "Aucun rapport fourni";
            Paragraph rapportContent = new Paragraph(rapport, valueFont);
            rapportContent.setAlignment(Element.ALIGN_LEFT);
            rapportContent.setLeading(1.5f);
            rapportCell.addElement(rapportContent);
            
            rapportTable.addCell(rapportCell);
            document.add(rapportTable);
            
            // Notes
            Paragraph notesTitle = new Paragraph("NOTES ET OBSERVATIONS", subTitleFont);
            notesTitle.setSpacingBefore(10);
            notesTitle.setSpacingAfter(8);
            document.add(notesTitle);
            
            PdfPTable notesTable = new PdfPTable(1);
            notesTable.setWidthPercentage(100);
            
            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.BOX);
            notesCell.setBorderWidth(1.5f);
            notesCell.setPadding(8);
            notesCell.setMinimumHeight(80);
            
            for (int i = 0; i < 4; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.BOTTOM);
                lineCell.setBorderWidthBottom(0.7f);
                lineCell.setBorderColorBottom(Color.GRAY);
                lineCell.setFixedHeight(20);
                lineCell.setPadding(0);
                
                lineTable.addCell(lineCell);
                notesCell.addElement(lineTable);
            }
            
            notesTable.addCell(notesCell);
            document.add(notesTable);
            
            // Signature
            Paragraph signatureTitle = new Paragraph("VALIDATION", subTitleFont);
            signatureTitle.setSpacingBefore(25);
            signatureTitle.setSpacingAfter(20);
            signatureTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(signatureTitle);
            
            PdfPTable signatureTable = new PdfPTable(2);
            signatureTable.setWidthPercentage(100);
            signatureTable.setWidths(new float[]{50, 50});
            
            // Partie Technicien
            PdfPCell techSignCell = new PdfPCell();
            techSignCell.setBorder(Rectangle.BOX);
            techSignCell.setBorderWidth(1.5f);
            techSignCell.setPadding(25);
            techSignCell.setBackgroundColor(new Color(250, 252, 250));
            
            Paragraph techSignTitle = new Paragraph("POUR LE TECHNICIEN", new Font(Font.HELVETICA, 11, Font.BOLD, COLOR_PRIMARY));
            techSignTitle.setAlignment(Element.ALIGN_CENTER);
            techSignTitle.setSpacingAfter(25);
            techSignCell.addElement(techSignTitle);
            
            Paragraph techName = new Paragraph("Nom du technicien : " + getValue(technicien), valueFont);
            techName.setSpacingAfter(25);
            techSignCell.addElement(techName);
            
            Paragraph techSignature = new Paragraph("Signature : _________________________", valueFont);
            techSignature.setSpacingAfter(25);
            techSignCell.addElement(techSignature);
            
            Paragraph techDate = new Paragraph("Date : ______________________________", valueFont);
            techSignCell.addElement(techDate);
            
            // Partie Cachet
            PdfPCell cachetCell = new PdfPCell();
            cachetCell.setBorder(Rectangle.BOX);
            cachetCell.setBorderWidth(1.5f);
            cachetCell.setPadding(25);
            cachetCell.setBackgroundColor(new Color(250, 252, 250));
            
            Paragraph cachetTitle = new Paragraph("CACHET DE LA SOCIÉTÉ", new Font(Font.HELVETICA, 11, Font.BOLD, COLOR_PRIMARY));
            cachetTitle.setAlignment(Element.ALIGN_CENTER);
            cachetTitle.setSpacingAfter(25);
            cachetCell.addElement(cachetTitle);
            
            PdfPTable cachetBox = new PdfPTable(1);
            cachetBox.setWidthPercentage(100);
            
            PdfPCell cachetInnerCell = new PdfPCell();
            cachetInnerCell.setBorder(Rectangle.BOX);
            cachetInnerCell.setBorderWidth(1f);
            cachetInnerCell.setBorderColor(new Color(150, 165, 155));
            cachetInnerCell.setMinimumHeight(90);
            cachetInnerCell.setPadding(15);
            
            Paragraph cachetSpace = new Paragraph("Espace réservé au cachet", new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY));
            cachetSpace.setAlignment(Element.ALIGN_CENTER);
            cachetInnerCell.addElement(cachetSpace);
            
            cachetBox.addCell(cachetInnerCell);
            cachetCell.addElement(cachetBox);
            
            signatureTable.addCell(techSignCell);
            signatureTable.addCell(cachetCell);
            document.add(signatureTable);
            
            // Footer
            Paragraph footer = new Paragraph(
                "Document interne - Engagement du technicien",
                new Font(Font.HELVETICA, 7, Font.ITALIC)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(15);
            document.add(footer);
            
            document.close();
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF interne: " + e.getMessage(), e);
        }
        
        return baos.toByteArray();
    }
    
    private void addSectionTitle(PdfPTable table, String title, Color color, int colspan) {
        Font titleFont = new Font(Font.HELVETICA, 12, Font.BOLD, color);
        Paragraph p = new Paragraph(title, titleFont);
        PdfPCell cell = new PdfPCell(p);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setColspan(colspan);
        cell.setBackgroundColor(COLOR_BG_SECTION);
        cell.setPadding(5);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }
    
    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(3);
        labelCell.setVerticalAlignment(Element.ALIGN_BASELINE);
        
        PdfPCell valueCell = new PdfPCell(new Paragraph(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(3);
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderWidthBottom(0.5f);
        valueCell.setVerticalAlignment(Element.ALIGN_BASELINE);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
    
    private String getValue(String value) {
        return value != null && !value.isEmpty() ? value : "—";
    }
    
    private String formatDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return "—";
        try {
            LocalDateTime date = LocalDateTime.parse(dateStr);
            return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (Exception e) {
            return dateStr;
        }
    }
}