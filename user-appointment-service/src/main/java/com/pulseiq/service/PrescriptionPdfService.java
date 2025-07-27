package com.pulseiq.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.pulseiq.dto.PrescriptionDto;
import com.pulseiq.dto.PrescriptionMedicineDto;
import com.pulseiq.entity.PrescriptionMedicine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionPdfService {

    private static final DeviceRgb HEADER_COLOR = new DeviceRgb(41, 128, 185);
    private static final DeviceRgb ACCENT_COLOR = new DeviceRgb(52, 152, 219);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(249, 249, 249);
    private static final DeviceRgb TEXT_COLOR = new DeviceRgb(44, 62, 80);
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(229, 229, 229);
    
    // Backward compatibility method
    public byte[] generatePrescriptionPdf(PrescriptionDto prescription) throws Exception {
        return generatePrescriptionPdf(prescription, 1); // Default to sequence number 1
    }
    
    public byte[] generatePrescriptionPdf(PrescriptionDto prescription, int sequenceNumber) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDocument = new PdfDocument(writer);
        Document document = new Document(pdfDocument, PageSize.A4);
        
        // Set margins
        document.setMargins(30, 30, 30, 30);

        // Create fonts
        PdfFont titleFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont smallFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

        // Add letterhead/header
        createHeader(document, titleFont, boldFont, sequenceNumber);

        // Add doctor and patient information
        createDoctorPatientInfo(document, prescription, boldFont, regularFont);

        // Add prescription details
        createPrescriptionDetails(document, prescription, boldFont, regularFont);

        // Add medicines table
        createMedicinesTable(document, prescription.getPrescriptionMedicines(), boldFont, regularFont);

        // Add footer with signature and notes
        createFooter(document, prescription, boldFont, regularFont, smallFont);

        // Add watermark
        addWatermark(pdfDocument, regularFont);

        document.close();
        return outputStream.toByteArray();
    }

    private void createHeader(Document document, PdfFont titleFont, PdfFont boldFont, int sequenceNumber) {
        // Create header with background
        Table headerTable = new Table(1).useAllAvailableWidth();
        headerTable.setMarginBottom(20);
        
        Cell headerCell = new Cell()
            .add(new Paragraph("PULSEIQ HEALTHCARE")
                .setFont(titleFont)
                .setFontSize(28)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5))
            .add(new Paragraph("MEDICAL PRESCRIPTION #" + sequenceNumber)
                .setFont(boldFont)
                .setFontSize(16)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5))
            .add(new Paragraph("Advanced Healthcare Management System")
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(HEADER_COLOR)
            .setBorder(Border.NO_BORDER)
            .setPadding(20);
        
        headerTable.addCell(headerCell);
        document.add(headerTable);
    }

    private void createDoctorPatientInfo(Document document, PrescriptionDto prescription, PdfFont boldFont, PdfFont regularFont) {
        // Create info section with two columns
        Table infoTable = new Table(2).useAllAvailableWidth();
        infoTable.setMarginBottom(15);

        // Doctor information
        Cell doctorCell = new Cell()
            .add(new Paragraph("DOCTOR INFORMATION")
                .setFont(boldFont)
                .setFontSize(12)
                .setFontColor(HEADER_COLOR)
                .setMarginBottom(8))
            .add(new Paragraph("Dr. " + prescription.getDoctorName())
                .setFont(boldFont)
                .setFontSize(11)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(3))
            .add(new Paragraph("Doctor ID: " + prescription.getDoctorId())
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(3))
            .add(new Paragraph("License No: " + (prescription.getDoctorLicenseNumber() != null ? prescription.getDoctorLicenseNumber() : "Not Available"))
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR))
            .setBackgroundColor(LIGHT_GRAY)
            .setBorder(new SolidBorder(BORDER_COLOR, 1))
            .setPadding(12);

        // Patient information
        Cell patientCell = new Cell()
            .add(new Paragraph("PATIENT INFORMATION")
                .setFont(boldFont)
                .setFontSize(12)
                .setFontColor(HEADER_COLOR)
                .setMarginBottom(8))
            .add(new Paragraph(prescription.getPatientName())
                .setFont(boldFont)
                .setFontSize(11)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(3))
            .add(new Paragraph("Patient ID: " + prescription.getPatientId())
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(3))
            .add(new Paragraph(""))
            .setBackgroundColor(LIGHT_GRAY)
            .setBorder(new SolidBorder(BORDER_COLOR, 1))
            .setPadding(12);

        infoTable.addCell(doctorCell);
        infoTable.addCell(patientCell);
        document.add(infoTable);
    }

    private void createPrescriptionDetails(Document document, PrescriptionDto prescription, PdfFont boldFont, PdfFont regularFont) {
        // Prescription details header
        Table detailsTable = new Table(1).useAllAvailableWidth();
        detailsTable.setMarginBottom(15);

        Cell detailsHeaderCell = new Cell()
            .add(new Paragraph("PRESCRIPTION DETAILS")
                .setFont(boldFont)
                .setFontSize(12)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(ACCENT_COLOR)
            .setBorder(Border.NO_BORDER)
            .setPadding(8);

        detailsTable.addCell(detailsHeaderCell);
        document.add(detailsTable);

        // Prescription info
        Table prescriptionInfoTable = new Table(3).useAllAvailableWidth();
        prescriptionInfoTable.setMarginBottom(15);

        // Date
        prescriptionInfoTable.addCell(createInfoCell("Date", 
            prescription.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy")), 
            boldFont, regularFont));

        // Time
        prescriptionInfoTable.addCell(createInfoCell("Time", 
            prescription.getCreatedAt().format(DateTimeFormatter.ofPattern("hh:mm a")), 
            boldFont, regularFont));

        // Prescription ID
        prescriptionInfoTable.addCell(createInfoCell("Prescription ID", 
            "PX" + String.format("%06d", prescription.getPrescriptionId()), 
            boldFont, regularFont));

        document.add(prescriptionInfoTable);

        // Add doctor notes if available
        if (prescription.getDoctorNotes() != null && !prescription.getDoctorNotes().trim().isEmpty()) {
            Table notesTable = new Table(1).useAllAvailableWidth();
            notesTable.setMarginBottom(15);

            Cell notesCell = new Cell()
                .add(new Paragraph("DOCTOR NOTES")
                    .setFont(boldFont)
                    .setFontSize(11)
                    .setFontColor(HEADER_COLOR)
                    .setMarginBottom(5))
                .add(new Paragraph(prescription.getDoctorNotes())
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setFontColor(TEXT_COLOR))
                .setBorder(new SolidBorder(BORDER_COLOR, 1))
                .setPadding(10);

            notesTable.addCell(notesCell);
            document.add(notesTable);
        }
    }

    private Cell createInfoCell(String label, String value, PdfFont boldFont, PdfFont regularFont) {
        return new Cell()
            .add(new Paragraph(label)
                .setFont(boldFont)
                .setFontSize(9)
                .setFontColor(HEADER_COLOR)
                .setMarginBottom(2))
            .add(new Paragraph(value)
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 1))
            .setPadding(8);
    }

    private void createMedicinesTable(Document document, List<PrescriptionMedicineDto> medicines, PdfFont boldFont, PdfFont regularFont) {
        // Medicines header
        Table medicinesHeaderTable = new Table(1).useAllAvailableWidth();
        medicinesHeaderTable.setMarginBottom(10);

        Cell medicinesHeaderCell = new Cell()
            .add(new Paragraph("PRESCRIBED MEDICATIONS")
                .setFont(boldFont)
                .setFontSize(12)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(ACCENT_COLOR)
            .setBorder(Border.NO_BORDER)
            .setPadding(8);

        medicinesHeaderTable.addCell(medicinesHeaderCell);
        document.add(medicinesHeaderTable);

        // Medicines table
        Table medicinesTable = new Table(UnitValue.createPercentArray(new float[]{3.5f, 1.5f, 1f, 1.5f, 2f, 1.5f, 1f})).useAllAvailableWidth();
        medicinesTable.setMarginBottom(20);

        // Table headers
        addTableHeader(medicinesTable, "Medicine", boldFont);
        addTableHeader(medicinesTable, "Power", boldFont);
        addTableHeader(medicinesTable, "Quantity", boldFont);
        addTableHeader(medicinesTable, "Duration", boldFont);
        addTableHeader(medicinesTable, "Dosage", boldFont);
        addTableHeader(medicinesTable, "Meal Timing", boldFont);
        addTableHeader(medicinesTable, "Instructions", boldFont);

        // Add medicine rows
        for (PrescriptionMedicineDto medicine : medicines) {
            addMedicineRow(medicinesTable, medicine, regularFont, boldFont);
        }

        document.add(medicinesTable);
    }

    private void addTableHeader(Table table, String text, PdfFont font) {
        Cell cell = new Cell()
            .add(new Paragraph(text)
                .setFont(font)
                .setFontSize(10)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(HEADER_COLOR)
            .setBorder(Border.NO_BORDER)
            .setPadding(8);
        table.addCell(cell);
    }

    private void addMedicineRow(Table table, PrescriptionMedicineDto medicine, PdfFont regularFont, PdfFont boldFont) {
        // Medicine name
        Cell nameCell = new Cell()
            .add(new Paragraph(medicine.getMedicineName())
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        // Medicine power
        Cell powerCell = new Cell()
            .add(new Paragraph(medicine.getMedicinePower())
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        // Quantity
        Cell quantityCell = new Cell()
            .add(new Paragraph(String.valueOf(medicine.getQuantity()))
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR)
                .setTextAlignment(TextAlignment.CENTER))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        // Duration
        Cell durationCell = new Cell()
            .add(new Paragraph(medicine.getDurationDays() + " days")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        // Dosage (frequency)
        Cell dosageCell = new Cell()
            .add(new Paragraph(buildDosageFrequency(medicine))
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        // Meal timing
        Cell mealTimingCell = new Cell()
            .add(new Paragraph(medicine.getMealTiming() != null ? formatMealTiming(medicine.getMealTiming()) : "As needed")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        // Instructions
        Cell instructionsCell = new Cell()
            .add(new Paragraph(medicine.getSpecialInstructions() != null ? medicine.getSpecialInstructions() : "As directed")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR))
            .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
            .setPadding(6);

        table.addCell(nameCell);
        table.addCell(powerCell);
        table.addCell(quantityCell);
        table.addCell(durationCell);
        table.addCell(dosageCell);
        table.addCell(mealTimingCell);
        table.addCell(instructionsCell);
    }

    private void createFooter(Document document, PrescriptionDto prescription, PdfFont boldFont, PdfFont regularFont, PdfFont smallFont) {
        // Notes section
        if (prescription.getDoctorNotes() != null && !prescription.getDoctorNotes().trim().isEmpty()) {
            Table notesTable = new Table(1).useAllAvailableWidth();
            notesTable.setMarginBottom(15);

            Cell notesCell = new Cell()
                .add(new Paragraph("ADDITIONAL NOTES")
                    .setFont(boldFont)
                    .setFontSize(11)
                    .setFontColor(HEADER_COLOR)
                    .setMarginBottom(5))
                .add(new Paragraph(prescription.getDoctorNotes())
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setFontColor(TEXT_COLOR))
                .setBorder(new SolidBorder(BORDER_COLOR, 1))
                .setPadding(10);

            notesTable.addCell(notesCell);
            document.add(notesTable);
        }

        // Signature section
        Table signatureTable = new Table(2).useAllAvailableWidth();
        signatureTable.setMarginTop(30);

        // Left side - General instructions
        Cell instructionsCell = new Cell()
            .add(new Paragraph("GENERAL INSTRUCTIONS")
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(HEADER_COLOR)
                .setMarginBottom(5))
            .add(new Paragraph("• Take medicines as prescribed")
                .setFont(smallFont)
                .setFontSize(8)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(2))
            .add(new Paragraph("• Complete the full course")
                .setFont(smallFont)
                .setFontSize(8)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(2))
            .add(new Paragraph("• Consult if side effects occur")
                .setFont(smallFont)
                .setFontSize(8)
                .setFontColor(TEXT_COLOR)
                .setMarginBottom(2))
            .add(new Paragraph("• Store medicines properly")
                .setFont(smallFont)
                .setFontSize(8)
                .setFontColor(TEXT_COLOR))
            .setBorder(Border.NO_BORDER)
            .setPadding(5);

        // Right side - Signature
        Cell signatureCell = new Cell()
            .add(new Paragraph("_________________________")
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(TEXT_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5))
            .add(new Paragraph("Dr. " + prescription.getDoctorName())
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(TEXT_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(2))
            .add(new Paragraph("Medical Professional")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(TEXT_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(2))
            .add(new Paragraph("License No: " + (prescription.getDoctorLicenseNumber() != null ? prescription.getDoctorLicenseNumber() : "Not Available"))
                .setFont(smallFont)
                .setFontSize(8)
                .setFontColor(TEXT_COLOR)
                .setTextAlignment(TextAlignment.CENTER))
            .setBorder(Border.NO_BORDER)
            .setPadding(5);

        signatureTable.addCell(instructionsCell);
        signatureTable.addCell(signatureCell);
        document.add(signatureTable);

        // Footer line
        LineSeparator separator = new LineSeparator(new SolidLine(0.5f));
        separator.setMarginTop(20);
        document.add(separator);

        // Bottom footer
        Paragraph footerText = new Paragraph("Generated by PulseIQ Healthcare Management System - " + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")))
            .setFont(smallFont)
            .setFontSize(8)
            .setFontColor(ACCENT_COLOR)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginTop(5);
        document.add(footerText);
    }

    private void addWatermark(PdfDocument pdfDocument, PdfFont font) {
        // Add diagonal watermark from bottom-left to top-right
        for (int i = 1; i <= pdfDocument.getNumberOfPages(); i++) {
            PdfPage page = pdfDocument.getPage(i);
            PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDocument);
            
            // Get page dimensions
            float pageWidth = page.getPageSize().getWidth();
            float pageHeight = page.getPageSize().getHeight();
            
            // Calculate center position
            float centerX = pageWidth / 2;
            float centerY = pageHeight / 2;
            
            // Calculate rotation angle (diagonal from bottom-left to top-right)
            double angle = Math.atan2(pageHeight, pageWidth);
            
            canvas.saveState()
                .setFillColorRgb(0.85f, 0.85f, 0.85f) // More visible watermark
                .beginText()
                .setFontAndSize(font, 48) // Larger font size
                .setTextMatrix((float)Math.cos(angle), (float)Math.sin(angle), 
                              -(float)Math.sin(angle), (float)Math.cos(angle), 
                              centerX - 60, centerY - 15) // Center the text
                .showText("PULSEIQ")
                .endText()
                .restoreState();
        }
    }
    
    private String buildDosageFrequency(PrescriptionMedicineDto medicine) {
        StringBuilder frequency = new StringBuilder();
        
        if (Boolean.TRUE.equals(medicine.getMorningDose())) {
            frequency.append("Morning");
        }
        if (Boolean.TRUE.equals(medicine.getNoonDose())) {
            if (frequency.length() > 0) frequency.append(" + ");
            frequency.append("Noon");
        }
        if (Boolean.TRUE.equals(medicine.getEveningDose())) {
            if (frequency.length() > 0) frequency.append(" + ");
            frequency.append("Evening");
        }
        
        return frequency.length() > 0 ? frequency.toString() : "As directed";
    }
    
    private String formatMealTiming(PrescriptionMedicine.MealTiming mealTiming) {
        switch (mealTiming) {
            case BEFORE_MEAL:
                return "Before Meal";
            case AFTER_MEAL:
                return "After Meal";
            case WITH_MEAL:
                return "With Meal";
            case EMPTY_STOMACH:
                return "Empty Stomach";
            default:
                return "As needed";
        }
    }
}
