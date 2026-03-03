import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

export default function ReportExporter({ title = "Report", filename = "export.pdf", children }) {
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef(null);

    const exportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            // Small timeout to ensure any re-renders or loaders are cleared
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Higher scale for better resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff' // Force white background for PDF
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // Calculate dimensions to fit A4 paper
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            // Center the image horizontally
            const marginX = (pdfWidth - finalWidth) / 2;

            pdf.addImage(imgData, 'JPEG', marginX, 10, finalWidth, finalHeight);
            pdf.save(filename);

        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF report.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold">{title}</h2>
                    <p className="text-sm text-gray-500">Interactive View • Ready for Export</p>
                </div>
                <button
                    onClick={exportPDF}
                    disabled={isExporting}
                    className="btn-primary flex items-center gap-2"
                >
                    <Download size={18} />
                    {isExporting ? 'Generating PDF...' : 'Download PDF Report'}
                </button>
            </div>

            {/* The actual printable area */}
            <div
                ref={reportRef}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm pdf-container"
                style={{ color: '#000' }} // Force black text for PDF readability
            >
                {children}
            </div>
        </div>
    );
}
