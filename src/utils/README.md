# Content Extraction in LightUp

This document describes the content extraction system used in the LightUp extension to filter out navigation bars and UI chrome elements when using the global action button.

## Current Implementation

The current implementation uses Mozilla's Readability.js with custom enhancements for mode-aware processing. It employs multiple strategies:

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

## Mozilla Readability.js Implementation

The system now uses Mozilla's Readability.js with the following enhancements:

### Key Features

1. **Mode-Aware Processing**: Content extraction is optimized based on the processing mode (summarize, analyze, explain, translate, free)
2. **Pre-processing**: Documents are cleaned before Readability processing to remove obvious UI elements
3. **Post-processing**: Content is further refined based on the specific mode requirements
4. **Fallback System**: Custom extraction methods are used if Readability fails

### Configuration

The implementation includes mode-specific configurations:
- **Translate Mode**: Focuses on pure text content, removes structural noise
- **Analyze Mode**: Preserves data elements and argumentative structure
- **Explain Mode**: Maintains definitions, examples, and instructional content
- **Summarize Mode**: Preserves hierarchical structure and key points

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
