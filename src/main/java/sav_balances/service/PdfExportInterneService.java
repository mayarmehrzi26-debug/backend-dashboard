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

    // ===== POLICES SUPPORTANT L'ARABE =====
    private static BaseFont baseFont;
    private static BaseFont arabicFont;
    
    static {
        try {
            // Essayer de charger Arial Unicode MS
            try {
                baseFont = BaseFont.createFont("c:/windows/fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                arabicFont = baseFont;
                System.out.println("✅ Police Arial chargée avec succès");
            } catch (Exception e) {
                try {
                    // Alternative : utiliser la police de iText
                    baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                    arabicFont = baseFont;
                    System.out.println("✅ Police Helvetica chargée avec succès");
                } catch (Exception e2) {
                    // Fallback
                    baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, false);
                    arabicFont = baseFont;
                    System.out.println("⚠️ Fallback sur Helvetica standard");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ===== FONCTIONS DE CRÉATION DE POLICES =====
    
    private Font createFont(float size, int style, Color color) {
        try {
            if (arabicFont != null) {
                return new Font(arabicFont, size, style, color);
            }
            return new Font(Font.HELVETICA, size, style, color);
        } catch (Exception e) {
            return new Font(Font.HELVETICA, size, style, color);
        }
    }

    private Font createFont(float size, int style) {
        return createFont(size, style, Color.BLACK);
    }

    private Font createFont(float size) {
        return createFont(size, Font.NORMAL);
    }

    // Classe interne utilitaire pour dessiner les lignes pointillées
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

    // ========== BON DE REÇUE (2 PARTIES : CLIENT & TECHNICIEN) ==========
    public byte[] generateFormulaireInternePdf(String numeroOrdre, String societe,
                                               String equipement,
                                               String reference,
                                               String dateReclamation,  
                                               String dateIntervention, 
                                               String reclamation,
                                               String rapportIntervention) {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        document.setMargins(30, 30, 20, 20);  
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // ===== CRÉATION DES POLICES =====
            Font companyFont = createFont(14, Font.BOLD, COLOR_PRIMARY);
            Font detailsHeaderFont = createFont(8, Font.NORMAL, Color.DARK_GRAY);
            Font subTitleFont = createFont(14, Font.BOLD, COLOR_SECONDARY);
            Font labelFont = createFont(10, Font.BOLD, COLOR_SECONDARY);
            Font valueFont = createFont(10, Font.NORMAL);
            Font smallFont = createFont(8, Font.NORMAL);
            Font reclamationFont = createFont(10, Font.ITALIC, Color.DARK_GRAY);
            Font referenceFont = createFont(10, Font.ITALIC, new Color(80, 80, 80));
            Font warningFont = createFont(10, Font.BOLD, new Color(255, 0, 0));
            
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
            
            // Titre Principal
            Paragraph title = new Paragraph("ORDRE D'INTERVENTION INTERNE N° " + numeroOrdre, subTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(5);
            title.setSpacingAfter(5);
            document.add(title);
          
            // ========== TABLEAU DES INFORMATIONS (PARTIE CLIENT) ==========
            PdfPTable mainTable = new PdfPTable(2);
            mainTable.setWidthPercentage(100);
            mainTable.setWidths(new float[]{35, 65});
            
            addSectionTitle(mainTable, "📋 INFORMATIONS CLIENT", COLOR_PRIMARY, 2);
            addRow(mainTable, "N° Ordre :", getValue(numeroOrdre), labelFont, valueFont);
            addRow(mainTable, "Client :", getValue(societe), labelFont, valueFont);
            addRow(mainTable, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(mainTable, "N° de série :", getValue(reference), labelFont, referenceFont);
            
            addRow(mainTable, "Date de réclamation :", formatDate(dateReclamation), labelFont, valueFont);
            addRow(mainTable, "Date d'intervention :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(mainTable, "Réclamation :", getValue(reclamation), labelFont, reclamationFont);
            
            document.add(mainTable);
            
            // ===== MESSAGE D'AVERTISSEMENT EN ARABE ET FRANÇAIS =====
            Font warningFontFrench = createFont(10, Font.BOLD, new Color(255, 0, 0));
            Font warningFontArabic = createFont(10, Font.BOLD, new Color(255, 0, 0));
            
            // Message en Français
            Paragraph frenchWarning = new Paragraph(
                "⚠️ Au-delà de 30 jours à compter du dépôt, l'appareil n'est plus sous notre responsabilité.",
                warningFontFrench
            );
            frenchWarning.setAlignment(Element.ALIGN_CENTER);
            frenchWarning.setSpacingBefore(3);
            frenchWarning.setSpacingAfter(2);
            document.add(frenchWarning);
            
            // ===== TEXTE ARABE CORRIGÉ =====
            String arabicText = "تنتهي مسؤوليتنا عن صيانة وحفظ الجهاز بانقضاء ثلاثين (30) يومًا ابتداءً من تاريخ إيداعه، ولا نكون ملزمين بتعويض أي ضرر يلحق به بعد ذلك.";
            
            Paragraph arabicWarning = new Paragraph(arabicText, warningFontArabic);
            arabicWarning.setAlignment(Element.ALIGN_CENTER);
            arabicWarning.setSpacingBefore(2);
            arabicWarning.setSpacingAfter(5);
            document.add(arabicWarning);

            // Pointillés de découpage pour détacher le coupon
            Paragraph separator = new Paragraph(
                "— — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —",
                new Font(Font.HELVETICA, 10, Font.NORMAL)
            );
            separator.setSpacingBefore(5);
            separator.setSpacingAfter(10);
            document.add(separator);
            
            // ========== PARTIE INFÉRIEURE - POUR LE TECHNICIEN ==========
            PdfPTable techTable = new PdfPTable(2);
            techTable.setWidthPercentage(100);
            techTable.setWidths(new float[]{35, 65});
            
            addSectionTitle(techTable, "🔧 INFORMATIONS TECHNICIEN", COLOR_PRIMARY, 2);
            addRow(techTable, "N° Ordre :", getValue(numeroOrdre), labelFont, valueFont);
            addRow(techTable, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(techTable, "N° de série :", getValue(reference), labelFont, referenceFont);
            
            addRow(techTable, "Date de réclamation :", formatDate(dateReclamation), labelFont, valueFont);
            addRow(techTable, "Date d'intervention :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(techTable, "Réclamation :", getValue(reclamation), labelFont, reclamationFont);
            
            document.add(techTable);
            
            // Instance partagée de l'événement pointillé
            DashedLineCellEvent dashedEvent = new DashedLineCellEvent();

            // ========== ZONE RAPPORT D'INTERVENTION ==========
            Paragraph rapportTitle = new Paragraph("📝 RAPPORT D'INTERVENTION", createFont(11, Font.BOLD, COLOR_SECONDARY));
            rapportTitle.setSpacingBefore(4);
            rapportTitle.setSpacingAfter(3);
            document.add(rapportTitle);
            
            PdfPTable rapportTable = new PdfPTable(1);
            rapportTable.setWidthPercentage(100);
            
            PdfPCell rapportCell = new PdfPCell();
            rapportCell.setBorder(Rectangle.BOX);
            rapportCell.setBorderWidth(1.5f);
            rapportCell.setPadding(8);
            
            for (int i = 0; i < 7; i++) {
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
            Paragraph notesTitle = new Paragraph("📝 NOTES ET OBSERVATIONS", createFont(11, Font.BOLD, COLOR_SECONDARY));
            notesTitle.setSpacingBefore(10);
            notesTitle.setSpacingAfter(5);
            document.add(notesTitle);
            
            PdfPTable notesTable = new PdfPTable(1);
            notesTable.setWidthPercentage(100);
            
            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.BOX);
            notesCell.setBorderWidth(1.5f);
            notesCell.setPadding(8);
            
            // Section Options
            PdfPTable optionsSubTable = new PdfPTable(3);
            optionsSubTable.setWidthPercentage(100);
            optionsSubTable.setWidths(new float[]{25, 30, 45}); 
            
            Font zapfFont = new Font(Font.ZAPFDINGBATS, 10, Font.NORMAL, Color.DARK_GRAY);
            Font optionFont = createFont(10, Font.BOLD, Color.DARK_GRAY);
            
            // Case 1 : Confirmé
            Phrase confPhrase = new Phrase();
            confPhrase.add(new Chunk("q", zapfFont));
            confPhrase.add(new Chunk(" Confirmé", optionFont));
            PdfPCell confCell = new PdfPCell(confPhrase);
            confCell.setBorder(Rectangle.NO_BORDER);
            confCell.setPaddingBottom(8);
            
            // Case 2 : Non Confirmé
            Phrase nonConfPhrase = new Phrase();
            nonConfPhrase.add(new Chunk("q", zapfFont));
            nonConfPhrase.add(new Chunk(" Non confirmé", optionFont));
            PdfPCell nonConfCell = new PdfPCell(nonConfPhrase);
            nonConfCell.setBorder(Rectangle.NO_BORDER);
            nonConfCell.setPaddingBottom(8);
            
            // Case 3 : Prix estimé
            Paragraph pricePara = new Paragraph("💰 Prix estimé : ........................ DT", optionFont);
            PdfPCell priceCell = new PdfPCell(pricePara);
            priceCell.setBorder(Rectangle.NO_BORDER);
            priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            priceCell.setPaddingBottom(8);
            
            optionsSubTable.addCell(confCell);
            optionsSubTable.addCell(nonConfCell);
            optionsSubTable.addCell(priceCell);
            
            notesCell.addElement(optionsSubTable);
            
            // Lignes pointillées
            for (int i = 0; i < 3; i++) {
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
            
            // ========== BOX TECHNICIEN ET SIGNATURE ==========
            Paragraph signatureTitle = new Paragraph("✅ TECHNICIEN", createFont(10, Font.BOLD, COLOR_SECONDARY));
            signatureTitle.setSpacingBefore(10);
            signatureTitle.setSpacingAfter(5);
            document.add(signatureTitle);
            
            PdfPTable signatureBoxTable = new PdfPTable(2);
            signatureBoxTable.setWidthPercentage(100);
            signatureBoxTable.setWidths(new float[]{50, 50});
            
            PdfPCell nameCell = new PdfPCell();
            nameCell.setBorder(Rectangle.BOX);
            nameCell.setBorderWidth(1f);
            nameCell.setPadding(8);
            nameCell.setBackgroundColor(COLOR_LIGHT_BG);
            
            Paragraph nameLabel = new Paragraph("👤 Nom du technicien :", createFont(9, Font.BOLD, COLOR_SECONDARY));
            nameLabel.setSpacingAfter(3);
            nameCell.addElement(nameLabel);
            nameCell.addElement(new Paragraph("_________________________", valueFont));
            signatureBoxTable.addCell(nameCell);
            
            PdfPCell signCell = new PdfPCell();
            signCell.setBorder(Rectangle.BOX);
            signCell.setBorderWidth(1f);
            signCell.setPadding(8);
            signCell.setBackgroundColor(COLOR_LIGHT_BG);
            
            Paragraph signLabel = new Paragraph("✍️ Signature :", createFont(9, Font.BOLD, COLOR_SECONDARY));
            signLabel.setSpacingAfter(3);
            signCell.addElement(signLabel);
            signCell.addElement(new Paragraph("_________________________", valueFont));
            signatureBoxTable.addCell(signCell);
            
            document.add(signatureBoxTable);
            
            // Footer
            Paragraph footer = new Paragraph("Document interne - Engagement du technicien", createFont(7, Font.ITALIC));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(1);
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
                                              String dateReclamation,  
                                              String dateIntervention, 
                                              String dateRecuperation,
                                              String reclamation) {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        document.setMargins(30, 30, 20, 20);  
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // ===== CRÉATION DES POLICES =====
            Font companyFont = createFont(14, Font.BOLD, COLOR_PRIMARY);
            Font detailsHeaderFont = createFont(8, Font.NORMAL, Color.DARK_GRAY);
            Font subTitleFont = createFont(14, Font.BOLD, COLOR_SECONDARY);
            Font labelFont = createFont(10, Font.BOLD, COLOR_SECONDARY);
            Font valueFont = createFont(10, Font.NORMAL);
            Font smallFont = createFont(8, Font.NORMAL);
            Font reclamationFont = createFont(10, Font.ITALIC, Color.DARK_GRAY);
            Font referenceFont = createFont(10, Font.ITALIC, new Color(80, 80, 80));
            Font bigValueFont = createFont(14, Font.BOLD, COLOR_PRIMARY);
            
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
            
            Paragraph title = new Paragraph("BON DE RÉCUPÉRATION N° " + numeroOrdre, subTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(20);
            title.setSpacingAfter(12);
            document.add(title);
            
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35, 65});
            
            addSectionTitle(table, "📋 INFORMATIONS", COLOR_PRIMARY, 2);
            addRow(table, "N° Ordre :", getValue(numeroOrdre), labelFont, valueFont);
            addRow(table, "Client :", getValue(societe), labelFont, valueFont);
            addRow(table, "Équipement :", getValue(equipement), labelFont, valueFont);
            addRow(table, "N° de série :", getValue(reference), labelFont, referenceFont);
            
            addRow(table, "Date de réclamation :", formatDate(dateReclamation), labelFont, valueFont);
            addRow(table, "Date d'intervention :", formatDate(dateIntervention), labelFont, valueFont);
            addRow(table, "Réclamation :", getValue(reclamation), labelFont, reclamationFont);
            
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
            
            Paragraph message = new Paragraph("✅ Équipement récupéré par le client", createFont(10, Font.BOLD, COLOR_PRIMARY));
            message.setAlignment(Element.ALIGN_CENTER);
            message.setSpacingBefore(20);
            document.add(message);
            
            Paragraph footer = new Paragraph("Merci pour votre confiance !", createFont(10, Font.ITALIC, COLOR_PRIMARY));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            document.add(footer);
            
            document.close();
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du bon de récupération: " + e.getMessage(), e);
        }
        
        return baos.toByteArray();
    }
    
    // ========== MÉTHODES UTILITAIRES DE MISE EN PAGE ==========
    
    private void addSectionTitle(PdfPTable table, String title, Color color, int colspan) {
        Font titleFont = createFont(12, Font.BOLD, color);
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
        
        PdfPCell valueCell = new PdfPCell(new Paragraph(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(3);
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderWidthBottom(0.5f);
        
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