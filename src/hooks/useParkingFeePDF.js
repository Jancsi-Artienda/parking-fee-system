import { jsPDF } from "jspdf";

const MAX_TABLE_ROWS = 15;

function truncateText(value, maxLength = 38) {
  const text = String(value || "");
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

export const useParkingFeePDF = () => {
  const generatePDF = ({
    preparedBy = "",
    coverage = "",
    dateSubmitted = "",
    rows = [],
  } = {}) => {
    const doc = new jsPDF();

    const leftMargin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const labelLineX = 75;
    const labelLineWidth = 120;

    let y = 20;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("e-Konek Pilipinas, Inc", leftMargin, y);

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text("Parking Fee Report", leftMargin, y);

    y += 15;

    const drawField = (label, value) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, leftMargin, y);
      doc.setLineWidth(0.3);
      doc.line(labelLineX, y, labelLineX + labelLineWidth, y);
      if (value) {
        doc.setFont("helvetica", "normal");
        doc.text(truncateText(value, 42), labelLineX + 2, y - 1);
      }
      y += 10;
    };

    drawField("Name", preparedBy);
    drawField("Coverage", coverage);
    drawField("Date Submitted", dateSubmitted);

    y += 5;

    const tableX = leftMargin;
    const tableWidth = pageWidth - tableX * 2;
    const colWidths = [40, 100, 40];
    const rowHeight = 10;
    const tableStartY = y;

    doc.setLineWidth(0.5);
    doc.rect(tableX, tableStartY, tableWidth, rowHeight * (MAX_TABLE_ROWS + 1));

    let currentX = tableX;
    colWidths.forEach((width, index) => {
      if (index < colWidths.length - 1) {
        currentX += width;
        doc.line(
          currentX,
          tableStartY,
          currentX,
          tableStartY + rowHeight * (MAX_TABLE_ROWS + 1)
        );
      }
    });

    for (let i = 1; i <= MAX_TABLE_ROWS + 1; i += 1) {
      doc.line(
        tableX,
        tableStartY + rowHeight * i,
        tableX + tableWidth,
        tableStartY + rowHeight * i
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    const headers = ["Date", "Car Model", "Amount"];
    currentX = tableX;
    headers.forEach((header, index) => {
      doc.text(header, currentX + colWidths[index] / 2, tableStartY + 7, {
        align: "center",
      });
      currentX += colWidths[index];
    });

    const printableRows = rows.slice(0, MAX_TABLE_ROWS);

    if (printableRows.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      printableRows.forEach((entry, index) => {
        const rowY = tableStartY + rowHeight * (index + 1) + 7;

        currentX = tableX;
        if (entry.date) {
          doc.text(truncateText(entry.date, 14), currentX + 3, rowY);
        }

        currentX += colWidths[0];
        if (entry.carModel) {
          doc.text(truncateText(entry.carModel, 30), currentX + 3, rowY);
        }

        currentX += colWidths[1];
        if (entry.amount) {
          doc.text(truncateText(entry.amount, 12), currentX + 3, rowY);
        }
      });
    }

    y = tableStartY + rowHeight * (MAX_TABLE_ROWS + 1) + 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Certified true and correct:", leftMargin, y);
    doc.setLineWidth(0.3);
    doc.line(leftMargin + 75, y, leftMargin + 155, y);

    const filenameDate = new Date().toISOString().slice(0, 10);
    doc.save(`parking-fee-report-${filenameDate}.pdf`);
  };

  return { generatePDF, maxRows: MAX_TABLE_ROWS };
};

export default useParkingFeePDF;
