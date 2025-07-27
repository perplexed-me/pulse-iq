package com.pulseiq.service;

import com.pulseiq.dto.PaymentReceiptDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
public class PdfReceiptService {

    private static final Logger logger = LoggerFactory.getLogger(PdfReceiptService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public byte[] generatePaymentReceipt(PaymentReceiptDto receipt) throws IOException {
        logger.info("Generating PDF receipt for transaction: {}", receipt.getTransactionId());
        
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                
                // Main Header - PAYMENT RECEIPT
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("PAYMENT RECEIPT");
                contentStream.endText();

                // Company Name
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("PulseIQ Payment System");
                contentStream.endText();

                // Transaction Details Header
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 690);
                contentStream.showText("Transaction Details");
                contentStream.endText();

                // Draw a line under Transaction Details
                contentStream.moveTo(50, 685);
                contentStream.lineTo(550, 685);
                contentStream.stroke();

                float yPosition = 650;
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);

                // Transaction details (excluding email, phone, address)
                String[][] transactionFields = {
                    {"Transaction ID:", receipt.getTransactionId()},
                    {"Status:", receipt.getStatus()},
                    {"Date:", receipt.getTransactionTime() != null ? receipt.getTransactionTime().format(DATE_FORMATTER) : "N/A"},
                    {"Payment Method:", receipt.getPaymentMethod()},
                    {"Amount:", receipt.getCurrency() + " " + String.format("%.2f", receipt.getAmount())},
                    {"Customer Name:", receipt.getCustomerName()}
                };

                for (String[] field : transactionFields) {
                    if (field[1] != null && !field[1].trim().isEmpty()) {
                        // Field label
                        contentStream.beginText();
                        contentStream.newLineAtOffset(50, yPosition);
                        contentStream.showText(field[0]);
                        contentStream.endText();

                        // Field value
                        contentStream.beginText();
                        contentStream.newLineAtOffset(180, yPosition);
                        contentStream.showText(field[1]);
                        contentStream.endText();

                        yPosition -= 20;
                    }
                }

                // Footer messages
                yPosition -= 30;
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 10);
                
                contentStream.beginText();
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("This is a computer-generated receipt and does not require a signature.");
                contentStream.endText();

                yPosition -= 15;
                contentStream.beginText();
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("For any queries, please contact our support team.");
                contentStream.endText();

                yPosition -= 30;
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("Generated on: " + (receipt.getTransactionTime() != null ? 
                    receipt.getTransactionTime().format(DATE_FORMATTER) : 
                    java.time.LocalDateTime.now().format(DATE_FORMATTER)));
                contentStream.endText();
            }

            // Convert to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);
            logger.info("PDF receipt generated successfully for transaction: {}", receipt.getTransactionId());
            return outputStream.toByteArray();
        }
    }
}