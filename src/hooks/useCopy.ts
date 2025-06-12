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

    // Determine elementSelector if string, or direct element
    let elementSelector: string | null = null;

    try {
      let element: HTMLElement | null = null;

      if (typeof target !== 'string' && target) {
        element = target as HTMLElement;
        console.log('Received direct HTMLElement target');
      } else {
        elementSelector = target as string;
      }

      if (elementSelector) {
        console.log('Looking for element with selector:', elementSelector);
      }

      // Strategy 1: Find the button that triggered this and work backwards to find the popup
      const allButtons = document.querySelectorAll('button');
      let popupContainer: HTMLElement | null = null;
      
      for (const button of allButtons) {
        if (button.title?.includes('Copy as image')) {
          // Found our button, now find its parent popup container
          let parent = button.parentElement;
          while (parent) {
            // Look for a container that looks like our popup
            if (parent.style.position === 'fixed' || 
                parent.getAttribute('data-plasmo-popup') !== null ||
                parent.classList.contains('lu-popup') ||
                parent.querySelector('.lu-scroll-container')) {
              popupContainer = parent;
              console.log('Found popup container via button:', popupContainer);
              break;
            }
            parent = parent.parentElement;
          }
          break;
        }
      }
      
      // Strategy 2: Look for any fixed position elements that contain substantial content
      if (!popupContainer) {
        const fixedElements = document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]');
        for (const el of fixedElements) {
          const htmlEl = el as HTMLElement;
          if (htmlEl.offsetWidth > 300 && htmlEl.offsetHeight > 200 && 
              htmlEl.textContent && htmlEl.textContent.length > 100) {
            popupContainer = htmlEl;
            console.log('Found popup container via fixed positioning:', popupContainer);
            break;
          }
        }
      }
      
      // Strategy 3: Search in document for our specific data attributes
      const searchContext = popupContainer || document;
      console.log('Final search context:', searchContext);
      
      // Function to search within the correct context
      const findElement = (selector: string, context: Document | ShadowRoot | Element): HTMLElement | null => {
        if (selector.startsWith('#')) {
          if (context === document) {
            return document.getElementById(selector.slice(1));
          } else {
            return (context as ShadowRoot | Element).querySelector(selector) as HTMLElement;
          }
        } else {
          return (context as Document | ShadowRoot | Element).querySelector(selector) as HTMLElement;
        }
      };
      
      // Try to find element in the appropriate context
      if (elementSelector) {
        element = findElement(elementSelector, searchContext);
        console.log('Found element by selector:', element);
      }

      if (!element) {
        console.log('Primary selector failed, trying fallbacks...');
        // Fallback: try to find the main content area with more specific selectors
        const fallbackSelectors = [
          '[data-lightup-response-content]',
          '[data-main-response-content]',
          '[data-markdown-container]', 
          '.lu-explanation',
          '[data-markdown-text]',
          '.markdown-content',
          'div[style*="textAlign"]',
          '.lu-scroll-container'
        ];
        
        for (const selector of fallbackSelectors) {
          element = findElement(selector, searchContext);
          console.log(`Trying fallback selector "${selector}":`, element);
          if (element) break;
        }
        
        // Additional fallback: search globally in document for any matching elements
        if (!element) {
          console.log('Trying global document search...');
          for (const selector of fallbackSelectors) {
            element = document.querySelector(selector) as HTMLElement;
            console.log(`Global search for "${selector}":`, element);
            if (element) break;
          }
        }
        
        // Try searching for extension-specific content only
        if (!element) {
          console.log('Trying to find extension content specifically...');
          
          // Look for elements that are clearly part of the extension
          const extensionSelectors = [
            // Try to find any element inside the extension popup
            '[data-plasmo-popup] div',
            'div[style*="position: fixed"] div',
            // Look for React component containers
            'div[data-reactroot] div',
            // Look for elements with extension-specific classes or attributes
            '.lu-explanation',
            '.lu-scroll-container > div',
            // Look for divs containing the actual response text
            'div[dir="ltr"]',
            'div[dir="rtl"]'
          ];
          
          for (const selector of extensionSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              const htmlEl = el as HTMLElement;
              // Check if this element contains substantial text and looks like AI response
              if (htmlEl.textContent && 
                  htmlEl.textContent.length > 100 && 
                  htmlEl.offsetWidth > 200 && 
                  htmlEl.offsetHeight > 50 &&
                  // Make sure it's not the website content
                  !htmlEl.closest('[id="_nex"]') &&
                  !htmlEl.closest('[class*="website"]') &&
                  !htmlEl.closest('[class*="page"]')) {
                element = htmlEl;
                console.log('Found extension content element:', element);
                break;
              }
            }
            if (element) break;
          }
        }
      }

      if (!element && popupContainer) {
        // Last resort: capture the entire popup content
        element = popupContainer;
        console.log('Last resort - using entire popup container:', element);
      }

      if (!element) {
        console.error('All element selection methods failed');
        console.error('Available elements in context:', searchContext);
        throw new Error('Could not find element to capture');
      }
      
      console.log('Final element selected for capture:', element, 'Dimensions:', element.offsetWidth, 'x', element.offsetHeight);

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

          console.log('Canvas blob created:', blob.size, 'bytes, type:', blob.type);

          // Create ClipboardItem and copy to clipboard
          const clipboardItem = new ClipboardItem({
            [blob.type]: blob
          });

          console.log('Writing to clipboard...');
          await navigator.clipboard.write([clipboardItem]);
          
          console.log('Successfully copied image to clipboard!');
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
            console.log('Fallback: Triggered download instead');
          } catch (downloadError) {
            console.error('Download fallback also failed:', downloadError);
            throw new Error('Both clipboard and download failed');
          }
        }
      }, 'image/png', 0.95);

    } catch (err) {
      console.error('Failed to copy as image:', err);
      // Fallback to text copy if image copy fails
      const textContent = elementSelector ? (document.querySelector(elementSelector)?.textContent || '') : '';
      if (textContent) {
        await handleCopy(textContent, id);
      }
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