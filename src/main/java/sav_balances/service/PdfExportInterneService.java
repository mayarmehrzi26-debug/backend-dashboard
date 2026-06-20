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
    private static final Color COLOR_LIGHT_BG = new Color(250, 252, 250);

    // Classe interne utilitaire robuste pour dessiner les lignes pointillées
    private static class DashedLineCellEvent implements PdfPCellEvent {
        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
            PdfContentByte cb = (canvases.length > 2) ? canvases[2] : canvases[canvases.length - 1];
            
            cb.saveState();
            cb.setColorStroke(Color.GRAY);
            cb.setLineWidth(0.5f);
            cb.setLineDash(2f, 3f, 0f); 
            
            cb.moveTo(position.getLeft(), position.getBottom());
            cb.lineTo(position.getRight(), position.getBottom());
            cb.stroke();
            cb.restoreState();
        }
    }

    // ========== BON DE REÇUE (2 PARTIES) ==========
    public byte[] generateFormulaireInternePdf(String numeroOrdre, String societe,
                                                String equipement,
                                                String reference,
                                                String dateIntervention,
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
            Font referenceFont = new Font(Font.HELVETICA, 10, Font.ITALIC, new Color(80, 80, 80));
            
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
            
            // ========== TABLEAU DES INFORMATIONS (PARTIE CLIENT) ==========
            PdfPTable mainTable = new PdfPTable(2);
            mainTable.setWidthPercentage(100);
            mainTable.setWidths(new float[]{35, 65});
            
            addSectionTitle(mainTable, "📋 INFORMATIONS CLIENT", COLOR_PRIMARY, 2);
            addRow(mainTable, "N° Ordre :", getValue(numeroOrdre), labelFont, valueFont);
            addRow(mainTable, "Société :", getValue(societe), labelFont, valueFont);
            addRow(mainTable, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(mainTable, "Référence :", getValue(reference), labelFont, referenceFont);
            addRow(mainTable, "Date de réclamation :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(mainTable, "Réclamation :", getValue(reclamation), labelFont, reclamationFont);
            
            document.add(mainTable);
            
            // Message pour le client
            Paragraph clientMessage = new Paragraph(
                "⚠️ Après 30 jours de dépôt de l’appareil sans récupération, nous ne sommes plus responsables de l’appareil.",
                new Font(Font.HELVETICA, 10, Font.ITALIC, Color.DARK_GRAY)
            );
            clientMessage.setAlignment(Element.ALIGN_CENTER);
            clientMessage.setSpacingBefore(5);
            clientMessage.setSpacingAfter(5);
            document.add(clientMessage);
            
            // Ligne de découpage
            Paragraph separator = new Paragraph(
                "— — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —",
                new Font(Font.HELVETICA, 10, Font.NORMAL)
            );
            separator.setSpacingBefore(5);
            separator.setSpacingAfter(8);
            document.add(separator);
            
            // ========== PARTIE INFÉRIEURE - POUR LE TECHNICIEN ==========
            PdfPTable techTable = new PdfPTable(2);
            techTable.setWidthPercentage(100);
            techTable.setWidths(new float[]{35, 65});
            
            addSectionTitle(techTable, "🔧 INFORMATIONS TECHNICIEN", COLOR_PRIMARY, 2);
            addRow(techTable, "N° Ordre :", getValue(numeroOrdre), labelFont, valueFont);
            addRow(techTable, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(techTable, "Référence :", getValue(reference), labelFont, referenceFont);
            addRow(techTable, "Date de réclamation :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(techTable, "Réclamation :", getValue(reclamation), labelFont, reclamationFont);
            
            document.add(techTable);
            
            // Instance partagée de l'événement pointillé
            DashedLineCellEvent dashedEvent = new DashedLineCellEvent();

            // ========== ZONE RAPPORT D'INTERVENTION ==========
            Paragraph rapportTitle = new Paragraph("📝 RAPPORT D'INTERVENTION", new Font(Font.HELVETICA, 11, Font.BOLD, COLOR_SECONDARY));
            rapportTitle.setSpacingBefore(10);
            rapportTitle.setSpacingAfter(5);
            document.add(rapportTitle);
            
            PdfPTable rapportTable = new PdfPTable(1);
            rapportTable.setWidthPercentage(100);
            
            PdfPCell rapportCell = new PdfPCell();
            rapportCell.setBorder(Rectangle.BOX);
            rapportCell.setBorderWidth(1.5f);
            rapportCell.setPadding(8);
            
            for (int i = 0; i < 3; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.NO_BORDER); 
                lineCell.setCellEvent(dashedEvent);     
                lineCell.setFixedHeight(18);
                lineCell.setPadding(0);
                
                lineTable.addCell(lineCell);
                rapportCell.addElement(lineTable);
            }
            
            rapportTable.addCell(rapportCell);
            document.add(rapportTable);
            
            // ========== ZONE NOTES ET OBSERVATIONS ==========
            Paragraph notesTitle = new Paragraph("📝 NOTES ET OBSERVATIONS", new Font(Font.HELVETICA, 11, Font.BOLD, COLOR_SECONDARY));
            notesTitle.setSpacingBefore(10);
            notesTitle.setSpacingAfter(5);
            document.add(notesTitle);
            
            PdfPTable notesTable = new PdfPTable(1);
            notesTable.setWidthPercentage(100);
            
            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.BOX);
            notesCell.setBorderWidth(1.5f);
            notesCell.setPadding(8);
            
            for (int i = 0; i < 8; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.NO_BORDER); 
                lineCell.setCellEvent(dashedEvent);     
                lineCell.setFixedHeight(18);
                lineCell.setPadding(0);
                
                lineTable.addCell(lineCell);
                notesCell.addElement(lineTable);
            }
            
            notesTable.addCell(notesCell);
            document.add(notesTable);
            
            // ========== PETIT BOX : NOM TECHNICIEN + SIGNATURE ==========
            Paragraph signatureTitle = new Paragraph("✅ TECHNICIEN", new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_SECONDARY));
            signatureTitle.setSpacingBefore(10);
            signatureTitle.setSpacingAfter(5);
            document.add(signatureTitle);
            
            // Petit tableau pour la signature
            PdfPTable signatureBoxTable = new PdfPTable(2);
            signatureBoxTable.setWidthPercentage(100);
            signatureBoxTable.setWidths(new float[]{50, 50});
            signatureBoxTable.setSpacingBefore(3);
            
            // Cellule gauche : Nom du technicien
            PdfPCell nameCell = new PdfPCell();
            nameCell.setBorder(Rectangle.BOX);
            nameCell.setBorderWidth(1f);
            nameCell.setPadding(8);
            nameCell.setBackgroundColor(COLOR_LIGHT_BG);
            nameCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            
            Paragraph nameLabel = new Paragraph("👤 Nom du technicien :", new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_SECONDARY));
            nameLabel.setSpacingAfter(3);
            nameCell.addElement(nameLabel);
            
            Paragraph nameValue = new Paragraph("_________________________", valueFont);
            nameCell.addElement(nameValue);
            
            signatureBoxTable.addCell(nameCell);
            
            // Cellule droite : Signature
            PdfPCell signCell = new PdfPCell();
            signCell.setBorder(Rectangle.BOX);
            signCell.setBorderWidth(1f);
            signCell.setPadding(8);
            signCell.setBackgroundColor(COLOR_LIGHT_BG);
            signCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            
            Paragraph signLabel = new Paragraph("✍️ Signature :", new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_SECONDARY));
            signLabel.setSpacingAfter(3);
            signCell.addElement(signLabel);
            
            Paragraph signValue = new Paragraph("_________________________", valueFont);
            signCell.addElement(signValue);
            
            signatureBoxTable.addCell(signCell);
            
            document.add(signatureBoxTable);
            
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
    
    // ========== BON DE RÉCUPÉRATION ==========
    public byte[] generateBonRecuperationPdf(String numeroOrdre, String societe,
                                              String equipement,
                                              String reference,
                                              Double prixPaye,
                                              String dateIntervention,
                                              String dateRecuperation,
                                              String reclamation) {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        document.setMargins(30, 30, 20, 20);  
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // ========== MÊME EN-TÊTE QUE LE PDF D'INTERVENTION ==========
            Font companyFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_PRIMARY);
            Font detailsHeaderFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.DARK_GRAY);
            Font subTitleFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_SECONDARY);
            Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_SECONDARY);
            Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 8, Font.NORMAL);
            Font reclamationFont = new Font(Font.HELVETICA, 10, Font.ITALIC, Color.DARK_GRAY);
            Font referenceFont = new Font(Font.HELVETICA, 10, Font.ITALIC, new Color(80, 80, 80));
            Font bigValueFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_PRIMARY);
            
            // En-tête identique
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
            Paragraph title = new Paragraph("BON DE RÉCUPÉRATION N° " + numeroOrdre, subTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(20);
            title.setSpacingAfter(12);
            document.add(title);
            
            // ========== TABLEAU DES INFORMATIONS ==========
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35, 65});
            
            addSectionTitle(table, "📋 INFORMATIONS", COLOR_PRIMARY, 2);
            addRow(table, "N° Ordre :", getValue(numeroOrdre), labelFont, valueFont);
            addRow(table, "Client :", getValue(societe), labelFont, valueFont);
            addRow(table, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(table, "Référence :", getValue(reference), labelFont, referenceFont);
            addRow(table, "Date de réclamation :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(table, "Date d'intervention :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(table, "Réclamation :", getValue(reclamation), labelFont, reclamationFont);
            
            // Montant payé en gros
            PdfPCell labelCell = new PdfPCell(new Paragraph("💰 Montant payé :", labelFont));
            labelCell.setBorder(Rectangle.NO_BORDER);
            labelCell.setPadding(3);
            
            PdfPCell valueCell = new PdfPCell(new Paragraph(prixPaye + " DT", bigValueFont));
            valueCell.setBorder(Rectangle.NO_BORDER);
            valueCell.setPadding(3);
            valueCell.setBorder(Rectangle.BOTTOM);
            valueCell.setBorderWidthBottom(0.5f);
            
            table.addCell(labelCell);
            table.addCell(valueCell);
            
            addRow(table, "📅 Date récupération :", formatDate(dateRecuperation), labelFont, valueFont);
            
            document.add(table);
            
            // ========== MESSAGE ==========
            Paragraph message = new Paragraph(
                "✅ Équipement récupéré par le client",
                new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_PRIMARY)
            );
            message.setAlignment(Element.ALIGN_CENTER);
            message.setSpacingBefore(20);
            document.add(message);
            
            // Footer
            Paragraph footer = new Paragraph(
                "Merci pour votre confiance !",
                new Font(Font.HELVETICA, 10, Font.ITALIC, COLOR_PRIMARY)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            document.add(footer);
            
            document.close();
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du bon de récupération: " + e.getMessage(), e);
        }
        
        return baos.toByteArray();
    }
    
    // ========== MÉTHODES UTILITAIRES ==========
    
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