import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  title?: string;
}

/**
 * Safely resolves any modern color value (e.g., oklch, lab, color-mix) to standard RGB/RGBA/HEX.
 */
function resolveColorToRgb(colorValue: string, ctx?: CanvasRenderingContext2D | null): string {
  if (!colorValue || colorValue === 'transparent' || colorValue === 'inherit' || colorValue === 'initial') {
    return colorValue;
  }
  if (!colorValue.includes('oklch') && !colorValue.includes('lab') && !colorValue.includes('color(')) {
    return colorValue;
  }

  // Use canvas 2d context to let the browser natively convert the color to rgb/rgba/hex
  try {
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorValue;
      return ctx.fillStyle;
    }
  } catch (e) {
    // ignore
  }

  return '#1e293b';
}

/**
 * Sanitizes all computed colors on a cloned DOM tree, replacing modern oklch/lab functions
 * with resolved standard rgb/rgba values so that canvas engines never choke.
 */
export function sanitizeClonedTreeColors(original: HTMLElement, clone: HTMLElement): void {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    ctx = canvas.getContext('2d');
  } catch (e) {
    ctx = null;
  }

  const origNodes = [original, ...Array.from(original.querySelectorAll('*'))] as HTMLElement[];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))] as HTMLElement[];

  const count = Math.min(origNodes.length, cloneNodes.length);
  for (let i = 0; i < count; i++) {
    const orig = origNodes[i];
    const cln = cloneNodes[i];

    if (!orig || !cln || !(cln instanceof HTMLElement)) continue;

    try {
      const computed = window.getComputedStyle(orig);

      // Color
      if (computed.color && computed.color.includes('oklch')) {
        cln.style.color = resolveColorToRgb(computed.color, ctx);
      }

      // Background Color
      if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
        cln.style.backgroundColor = resolveColorToRgb(computed.backgroundColor, ctx);
      }

      // Border Colors
      if (computed.borderTopColor && computed.borderTopColor.includes('oklch')) {
        cln.style.borderTopColor = resolveColorToRgb(computed.borderTopColor, ctx);
      }
      if (computed.borderRightColor && computed.borderRightColor.includes('oklch')) {
        cln.style.borderRightColor = resolveColorToRgb(computed.borderRightColor, ctx);
      }
      if (computed.borderBottomColor && computed.borderBottomColor.includes('oklch')) {
        cln.style.borderBottomColor = resolveColorToRgb(computed.borderBottomColor, ctx);
      }
      if (computed.borderLeftColor && computed.borderLeftColor.includes('oklch')) {
        cln.style.borderLeftColor = resolveColorToRgb(computed.borderLeftColor, ctx);
      }

      // SVG fill / stroke
      if (cln instanceof SVGElement) {
        if (computed.fill && computed.fill.includes('oklch')) {
          cln.style.fill = resolveColorToRgb(computed.fill, ctx);
        }
        if (computed.stroke && computed.stroke.includes('oklch')) {
          cln.style.stroke = resolveColorToRgb(computed.stroke, ctx);
        }
      }
    } catch (e) {
      // Continue without breaking
    }
  }
}

/**
 * Clean clone of an element for PDF rendering or printing:
 * Removes elements with .no-print class so they don't appear in the PDF,
 * and sanitizes modern oklch/lab colors to standard RGB.
 */
export function prepareCleanClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());
  sanitizeClonedTreeColors(element, clone);
  return clone;
}

/**
 * Downloads an HTML element as a high-resolution PDF file directly to the user's device.
 * Uses html2canvas-pro to support modern CSS color functions (including oklch, lab, display-p3)
 * and jsPDF for proper multi-page A4 document assembly.
 */
export async function downloadElementAsPDF(
  elementOrId: HTMLElement | string,
  defaultFilename: string,
  options?: PDFExportOptions
): Promise<boolean> {
  const element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!element) {
    console.error('Target element for PDF export not found:', elementOrId);
    return false;
  }

  const filename = (options?.filename || defaultFilename).endsWith('.pdf')
    ? (options?.filename || defaultFilename)
    : `${options?.filename || defaultFilename}.pdf`;

  // Parse margin [top, right, bottom, left] in mm
  let marginTop = 10;
  let marginRight = 10;
  let marginBottom = 12;
  let marginLeft = 10;

  if (typeof options?.margin === 'number') {
    marginTop = marginRight = marginBottom = marginLeft = options.margin;
  } else if (Array.isArray(options?.margin) && options.margin.length === 4) {
    [marginTop, marginRight, marginBottom, marginLeft] = options.margin;
  }

  let container: HTMLDivElement | null = null;

  try {
    // Clone and strip .no-print elements
    const cleanElement = prepareCleanClone(element);
    cleanElement.style.backgroundColor = '#ffffff';
    cleanElement.style.color = '#0f172a';
    cleanElement.style.width = '794px'; // standard A4 pixel width at 96 DPI
    cleanElement.style.maxWidth = '794px';
    cleanElement.style.minWidth = '794px';
    cleanElement.style.padding = '24px 28px';
    cleanElement.style.margin = '0';
    cleanElement.style.boxSizing = 'border-box';
    cleanElement.classList.add('pdf-clean-export');

    // Create temporary offscreen container
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = '794px';
    container.style.zIndex = '-9999';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.appendChild(cleanElement);
    document.body.appendChild(container);

    // Render using html2canvas-pro (with full support for modern CSS & oklch colors)
    const canvas = await html2canvas(cleanElement, {
      scale: 2, // 2x scale for sharp text rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    // A4 dimensions in mm
    const a4WidthMm = 210;
    const a4HeightMm = 297;
    const usableWidthMm = a4WidthMm - marginLeft - marginRight;
    const usableHeightMm = a4HeightMm - marginTop - marginBottom;

    const totalHeightMm = (canvas.height * usableWidthMm) / canvas.width;
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    if (totalHeightMm <= usableHeightMm) {
      // Fits in a single page
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, usableWidthMm, totalHeightMm);
    } else {
      // Multi-page slicing
      const pageHeightPx = Math.floor((usableHeightMm * canvas.width) / usableWidthMm);
      let remainingHeightPx = canvas.height;
      let sourceY = 0;
      let pageIndex = 0;

      while (remainingHeightPx > 0) {
        const currentChunkHeightPx = Math.min(remainingHeightPx, pageHeightPx);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentChunkHeightPx;
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            currentChunkHeightPx,
            0,
            0,
            canvas.width,
            currentChunkHeightPx
          );

          const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          const chunkHeightMm = (currentChunkHeightPx * usableWidthMm) / canvas.width;

          if (pageIndex > 0) {
            pdf.addPage('a4', 'portrait');
          }
          pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, usableWidthMm, chunkHeightMm);
        }

        sourceY += currentChunkHeightPx;
        remainingHeightPx -= currentChunkHeightPx;
        pageIndex++;
      }
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF via html2canvas-pro/jsPDF:', error);
    // Graceful fallback to browser print dialog
    printElementDirectly(element, filename.replace('.pdf', ''));
    return false;
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Triggers clean browser print for an element, ensuring document title matches for Save to PDF.
 */
export function printElementDirectly(
  elementOrId: HTMLElement | string,
  documentTitle?: string
): void {
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // Ensure any modal background or outer clipping is removed during print
  window.print();

  // Restore title after print dialog closes
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}
