import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { EventStats, TopKeywords } from '@/types/api';

export async function generatePDF(
  eventStats: EventStats,
  keywords: TopKeywords,
  speakerName: string
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(0, 102, 255); // Blue
  pdf.text('Feedback Report', margin, yPosition);
  yPosition += 15;

  // Event Info
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(eventStats.event_title, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Speaker: ${speakerName}`, margin, yPosition);
  yPosition += 5;
  
  if (eventStats.event_date) {
    pdf.text(`Event Date: ${new Date(eventStats.event_date).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }
  
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  // Executive Summary
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Executive Summary', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.text(`Total Feedback: ${eventStats.total_feedback}`, margin, yPosition);
  yPosition += 6;
  pdf.text(
    `Positive: ${eventStats.sentiment_distribution.positive.count} (${eventStats.sentiment_distribution.positive.percentage.toFixed(1)}%)`,
    margin,
    yPosition
  );
  yPosition += 6;
  pdf.text(
    `Negative: ${eventStats.sentiment_distribution.negative.count} (${eventStats.sentiment_distribution.negative.percentage.toFixed(1)}%)`,
    margin,
    yPosition
  );
  yPosition += 6;
  pdf.text(
    `Neutral: ${eventStats.sentiment_distribution.neutral.count} (${eventStats.sentiment_distribution.neutral.percentage.toFixed(1)}%)`,
    margin,
    yPosition
  );
  yPosition += 6;
  pdf.text(`Average Confidence: ${(eventStats.avg_confidence * 100).toFixed(1)}%`, margin, yPosition);
  yPosition += 15;

  // Quality Metrics
  pdf.setFontSize(14);
  pdf.text('Quality Metrics', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.text(`Accepted: ${eventStats.quality_breakdown.accepted}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Flagged: ${eventStats.quality_breakdown.flagged}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Rejected: ${eventStats.quality_breakdown.rejected}`, margin, yPosition);
  yPosition += 15;

  // Input Types
  pdf.setFontSize(14);
  pdf.text('Input Types', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.text(`Text: ${eventStats.input_type_breakdown.text}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Audio: ${eventStats.input_type_breakdown.audio}`, margin, yPosition);
  yPosition += 15;

  // Top Keywords
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(14);
  pdf.text('Top Keywords', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  keywords.keywords.slice(0, 20).forEach((kw, index) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(`${index + 1}. ${kw.word} - ${kw.count} (${kw.percentage.toFixed(1)}%)`, margin, yPosition);
    yPosition += 6;
  });

  // Save PDF
  pdf.save(`feedback-report-${eventStats.event_title.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}

export async function captureChartAsPNG(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) return '';

  const canvas = await html2canvas(element);
  return canvas.toDataURL('image/png');
}
