# Content Extraction in LightUp

This document describes the content extraction system used in the LightUp extension to filter out navigation bars and UI chrome elements when using the global action button.

## Current Implementation

The current implementation uses a custom content extraction algorithm that follows principles similar to Mozilla's Readability.js. It employs multiple strategies:

1. **Semantic Content Extraction**:
   - Prioritizes content in semantic HTML5 tags like `<article>`, `<main>`, etc.
   - Filters out common UI elements like navbars, footers, and sidebars
   - Most reliable on modern websites that follow HTML5 semantic standards

2. **Content Density Analysis**:
   - Uses text-to-HTML ratio to identify content-rich blocks
   - Applies a scoring system similar to Readability.js
   - Takes into account factors like text length, link density, and semantic tags
   - Particularly effective on older websites without semantic markup

3. **Filtered Body Content**:
   - Fallback method if other approaches fail
   - Removes known UI elements from a clone of the document
   - Returns the remaining text

## Upgrading to Mozilla's Readability.js

To upgrade to the official Mozilla Readability library:

1. Install the required packages:
   ```bash
   npm install @mozilla/readability jsdom
   ```

2. Modify `contentExtractor.ts` to use Readability:
   ```typescript
   import { Readability } from '@mozilla/readability';

   // Update the extractWithReadability function as follows:
   export const extractWithReadability = (doc: Document): string => {
     try {
       const reader = new Readability(doc);
       const article = reader.parse();
       if (article && article.textContent) {
         return article.textContent;
       }
       
       // Fall back to our custom implementation if Readability fails
       return extractMainContent();
     } catch (error) {
       console.error("Error using Readability:", error);
       return extractMainContent();
     }
   };

   // Then update getPageContent to use extractWithReadability:
   export const getPageContent = (): string => {
     // Get the page title for context
     const pageTitle = document.title;
     
     // Extract the main content using Readability
     const docClone = document.cloneNode(true) as Document;
     const mainContent = extractWithReadability(docClone);
     
     // Include the page title for context
     if (pageTitle) {
       return `PAGE: ${pageTitle}\n\n${mainContent}`;
     }
     
     return mainContent;
   };
   ```

3. Update imports in GlobalActionButton.tsx:
   ```typescript
   // Uncomment the Readability imports at the top of the file
   import { Readability } from '@mozilla/readability';
   import { JSDOM } from 'jsdom';
   ```

## Additional Enhancements

Potential future improvements:

1. **Site-Specific Rules**: Add special handling for popular websites
2. **User Configuration**: Allow users to customize content selectors
3. **Visual Highlighting**: Add a feature to show which content will be extracted
4. **Readability Options**: Configure Readability.js parameters for better results

## Troubleshooting

If content extraction is not working correctly:

1. Try using the "Debug Content Extraction" developer option to see which method is being used
2. Check if the website has unusual markup or dynamic content loading
3. Consider adding site-specific selectors for problematic websites
