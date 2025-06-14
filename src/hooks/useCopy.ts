import { useState } from 'react';
import { stripHtml } from '../utils/textProcessing';
import html2canvas from 'html2canvas';

interface UseCopyReturn {
  copiedId: string | null;
  imageCopiedId: string | null;
  handleCopy: (text: string, id: string) => Promise<void>;
  handleCopyAsImage: (target: HTMLElement | string, id: string) => Promise<void>;
  isImageCopySupported: boolean;
}

export const useCopy = (): UseCopyReturn => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageCopiedId, setImageCopiedId] = useState<string | null>(null);

  // Check if clipboard API supports writing images
  const isImageCopySupported = typeof navigator !== 'undefined' && 
    'clipboard' in navigator && 
    'write' in navigator.clipboard;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(stripHtml(text));
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopyAsImage = async (target: HTMLElement | string, id: string) => {
    if (!isImageCopySupported) {
      console.warn('Image copying not supported in this browser');
      return;
    }

    // Use requestIdleCallback to defer heavy work and prevent performance violations
    const performImageCapture = () => new Promise<void>((resolve, reject) => {
      const callback = async () => {
        try {
          await captureAndCopyImage(target, id);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(callback, 0);
      }
    });

    try {
      await performImageCapture();
    } catch (err) {
      console.error('Failed to copy as image:', err);
      // Fallback to text copy if image copy fails
      if (typeof target === 'string') {
        const textContent = document.querySelector(target)?.textContent || '';
        if (textContent) {
          await handleCopy(textContent, id);
        }
      }
    }
  };

  const captureAndCopyImage = async (target: HTMLElement | string, id: string) => {
    try {
      let element: HTMLElement | null = null;

      // If we already have a direct element reference, use it immediately
      if (typeof target !== 'string' && target) {
        element = target as HTMLElement;
      } else {
        // Use optimized element selection for string selectors
        const elementSelector = target as string;
        
        // Try direct selector first (fastest)
        element = document.querySelector(elementSelector) as HTMLElement;
        
        // If that fails, try a more targeted search
        if (!element) {
          // Look for fixed position containers first (likely our popup)
          const fixedContainers = document.querySelectorAll('[style*="position: fixed"], [data-plasmo-popup]');
          
          for (const container of fixedContainers) {
            element = container.querySelector(elementSelector) as HTMLElement;
            if (element) break;
            
            // Also try fallback selectors within this container
            const fallbackSelectors = [
              '[data-lightup-response-content]',
              '[data-main-response-content]',
              '.lu-explanation',
              '.lu-scroll-container'
            ];
            
            for (const selector of fallbackSelectors) {
              element = container.querySelector(selector) as HTMLElement;
              if (element) break;
            }
            if (element) break;
          }
        }
        
        // Final fallback: use any substantial content element
        if (!element) {
          const candidates = document.querySelectorAll('div');
          for (const candidate of candidates) {
            const htmlEl = candidate as HTMLElement;
            if (htmlEl.textContent && 
                htmlEl.textContent.length > 100 && 
                htmlEl.offsetWidth > 200 && 
                htmlEl.offsetHeight > 50 &&
                htmlEl.style.position === 'fixed') {
              element = htmlEl;
              break;
            }
          }
        }
      }

      if (!element) {
        throw new Error('Could not find element to capture');
      }

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        backgroundColor: null, // Transparent background
        scale: 2, // Higher DPI for better quality
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false, // Disable html2canvas logging
        foreignObjectRendering: false, // Prevent document.write() usage
        // Style overrides to ensure proper rendering
        onclone: (clonedDoc: Document) => {
          // Enhance the cloned document for better image quality
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Ensure proper font rendering */
            body, div, p, span, h1, h2, h3, h4, h5, h6 {
              font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* Hide scrollbars in the image */
            ::-webkit-scrollbar {
              display: none;
            }
            
            /* Ensure buttons and interactive elements are visible */
            button, a {
              opacity: 1 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // ------- Add footer with logo and website -------
      const footerHeight = 80; // px
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = canvas.height + footerHeight;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get composite canvas context');

      // Add padding to main content area
      const padding = 20; // px padding around the content
      
      // Fill main content area with white background (including padding)
      ctx.fillStyle = '#383838';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw main content with padding offset
      ctx.drawImage(canvas, padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));

      // Footer background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, canvas.height, compositeCanvas.width, footerHeight);

      // Footer text
      ctx.fillStyle = '#fff';
      ctx.font = "bold 32px 'K2D', sans-serif";
      const text = 'LightUp • boimaginations.com/lightup';
      const metrics = ctx.measureText(text);
      ctx.fillText(text, (compositeCanvas.width - metrics.width) / 2, canvas.height + footerHeight / 2 + 12);

      // TODO: Optionally add a logo image at left of text in future

      // Convert composite canvas to blob
      compositeCanvas.toBlob(async (blob: Blob | null) => {
        try {
          if (!blob) {
            throw new Error('Failed to create image blob');
          }

          // Create ClipboardItem and copy to clipboard
          const clipboardItem = new ClipboardItem({
            [blob.type]: blob
          });

          await navigator.clipboard.write([clipboardItem]);
          
          setImageCopiedId(id);
          setTimeout(() => {
            setImageCopiedId(null);
          }, 2000);
        } catch (clipboardError) {
          console.error('Clipboard write failed:', clipboardError);
          // Fallback: try to create a downloadable link
          try {
            const url = URL.createObjectURL(blob!);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lightup-response-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          } catch (downloadError) {
            console.error('Download fallback also failed:', downloadError);
            throw new Error('Both clipboard and download failed');
          }
        }
      }, 'image/png', 0.95);

    } catch (err) {
      throw err; // Re-throw to be handled by the outer try-catch
    }
  };

  return {
    copiedId,
    imageCopiedId,
    handleCopy,
    handleCopyAsImage,
    isImageCopySupported
  };
}; 