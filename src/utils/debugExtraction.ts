import { getPageContent } from "./contentExtractor";
import { displayImprovements, getImprovementSummary } from "./enhancementDemo";

/**
 * Debug utility to compare content extraction methods
 * This lets you see the difference between basic extraction and Defuddle
 */
export const compareExtractionMethods = () => {
  // First: capture elements before they are removed for comparison
  const allElementsCount = document.querySelectorAll('*').length;
  
  // Get elements we'd typically filter out
  const navigationElements = document.querySelectorAll('nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], .navigation, .menu, .sidebar, .navbar').length;
  
  // Get the original basic extraction (just innerText)
  const basicExtraction = document.body.innerText;
  
  // Get the Defuddle-enhanced extraction
  const defuddleExtraction = getPageContent();
  
  // Get a clean sample from both methods to better showcase differences
  // For basic extraction, try to eliminate obviously non-content lines
  let cleanedBasicLines = basicExtraction.split('\n')
    // Filter out very short lines which are likely UI elements
    .filter(line => line.trim().length > 5)
    // Filter out lines that are likely navigation or menu items
    .filter(line => !/^(home|menu|search|sign in|log in|login|contact|about)$/i.test(line.trim()));
    
  // Take a meaningful sample from both
  const basicSampleText = cleanedBasicLines.slice(0, 10).join('\n');
  
  // Calculate size difference
  const basicSize = new Blob([basicExtraction]).size;
  const defuddleSize = new Blob([defuddleExtraction]).size;
  const sizeDiff = basicSize - defuddleSize;
  const percentReduction = ((sizeDiff / basicSize) * 100).toFixed(2);
  
  // Find specific examples of removed UI text (these would be navigation items, etc.)
  const findRemovedUIElements = () => {
    // Create sets of words from both texts for comparison
    const basicWords = new Set(basicExtraction.split(/[\s.,;:!?]+/).map(w => w.toLowerCase()).filter(w => w.length > 3));
    const defuddleWords = new Set(defuddleExtraction.split(/[\s.,;:!?]+/).map(w => w.toLowerCase()).filter(w => w.length > 3));
    
    // Find words that only appear in the basic extraction (likely UI elements)
    const uiWords = Array.from(basicWords).filter(word => !defuddleWords.has(word)).slice(0, 20);
    
    return uiWords.join(', ');
  };
  
  // Get example UI elements that were removed
  const removedUIElements = findRemovedUIElements();
  
  // Create comparison results
  const comparison = {
    originalLength: basicExtraction.length,
    defuddleLength: defuddleExtraction.length,
    charsDifference: basicExtraction.length - defuddleExtraction.length,
    percentReduction: `${percentReduction}%`,
    bytesReduction: `${sizeDiff} bytes (${percentReduction}%)`,
    totalElements: allElementsCount,
    uiElements: navigationElements,
    basicSample: basicSampleText.substring(0, 300) + "...",
    defuddleSample: defuddleExtraction.substring(0, 300) + "...",
    removedUIElements: removedUIElements
  };
  
  console.log("🔍 CONTENT EXTRACTION COMPARISON:", comparison);
  
  return comparison;
};

/**
 * Debug content extraction and show visual difference
 */
export const debugContentExtraction = (mode?: string) => {
  // Log quality improvements
  console.log("🚀 Displaying LightUp Quality Enhancements...");
  displayImprovements(mode);
  
  // Get basic extraction (using document.body.innerText)
  const basicExtraction = document.body.innerText;
  
  // Get the enhanced extraction with mode-aware processing
  const enhancedExtraction = getPageContent(mode);
  
  // Calculate statistics
  const basicSize = new Blob([basicExtraction]).size;
  const enhancedSize = new Blob([enhancedExtraction]).size;
  const sizeDiff = basicSize - enhancedSize;
  const sizeReduction = ((sizeDiff / basicSize) * 100).toFixed(1);
  
  // Calculate word count differences
  const basicWords = new Set(basicExtraction.split(/[\s.,;:!?]+/).map(w => w.toLowerCase()).filter(w => w.length > 3));
  const enhancedWords = new Set(enhancedExtraction.split(/[\s.,;:!?]+/).map(w => w.toLowerCase()).filter(w => w.length > 3));
  
  // Find words that were filtered out (likely UI elements)
  const uiWords = Array.from(basicWords).filter(word => !enhancedWords.has(word)).slice(0, 20);
  
  // Get summary of enhancements
  const enhancementSummary = getImprovementSummary();
  
  console.group(`🔍 Content Extraction Debug${mode ? ` - ${mode.toUpperCase()} Mode` : ''}`);
  
  // Mode-specific information
  if (mode) {
    console.log(`🎯 Processing Mode: ${mode.toUpperCase()}`);
    console.log(`📋 Mode-specific optimizations applied`);
  }
  
  console.log("📊 Extraction Statistics:");
  console.log(`- Basic extraction: ${basicExtraction.length.toLocaleString()} characters`);
  console.log(`- Enhanced extraction: ${enhancedExtraction.length.toLocaleString()} characters`);
  console.log(`- Size reduction: ${sizeReduction}% (${sizeDiff.toLocaleString()} characters removed)`);
  console.log(`- Unique words in basic: ${basicWords.size.toLocaleString()}`);
  console.log(`- Unique words in enhanced: ${enhancedWords.size.toLocaleString()}`);
  
  if (uiWords.length > 0) {
    console.log(`- UI/navigation words filtered: ${uiWords.slice(0, 10).join(', ')}${uiWords.length > 10 ? '...' : ''}`);
  }
  
  console.groupEnd();
  
  // Determine effectiveness
  const effectiveness = sizeDiff > 1000 
    ? 'Significant improvement! Enhanced extraction has successfully removed a large amount of UI elements, navigation, and other non-content sections from the page. This results in much cleaner text for AI processing.' 
    : sizeDiff > 200 
    ? 'Good improvement. Enhanced extraction has removed some UI elements and non-content sections, resulting in cleaner text for AI processing.'
    : 'Minimal improvement. This page may already have clean content or the extraction may need refinement.';

  // Create comparison content for the popup
  const comparison = {
    basicLength: basicExtraction.length,
    enhancedLength: enhancedExtraction.length,
    charsDifference: basicExtraction.length - enhancedExtraction.length,
    sizeReduction: sizeReduction,
    basicWordCount: basicWords.size,
    enhancedWordCount: enhancedWords.size,
    mode: mode || 'default',
    enhancementSummary,
    effectiveness,
    uiWordsFiltered: uiWords.slice(0, 15),
    basicSample: basicExtraction.substring(0, 300) + "...",
    enhancedSample: enhancedExtraction.substring(0, 300) + "..."
  };

  // Show visual comparison popup
  showComparisonPopup(comparison);
};

const showComparisonPopup = (comparison: any) => {
  // Remove existing popup if any
  const existingPopup = document.getElementById('lightup-extraction-debug');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'lightup-extraction-debug';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    overflow-y: auto;
    backdrop-filter: blur(10px);
  `;

  // Enhanced content with quality improvements info
  popup.innerHTML = `
    <div style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">🔍 Content Extraction Debug</h2>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">${comparison.mode !== 'default' ? `Mode: ${comparison.mode.toUpperCase()}` : 'Default Mode'}</p>
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                style="background: rgba(255,255,255,0.2); border: none; border-radius: 8px; width: 32px; height: 32px; color: white; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">
          ×
        </button>
      </div>

      <!-- Quality Improvements Section -->
      <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #8fff8f; font-size: 18px;">🚀 Quality Enhancements Applied</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #8fff8f;">${comparison.enhancementSummary.totalImprovements}</div>
            <div style="font-size: 12px; opacity: 0.8;">Total Improvements</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ffdf8f;">${comparison.enhancementSummary.impactStats.high}</div>
            <div style="font-size: 12px; opacity: 0.8;">High Impact</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #8fdfff;">${comparison.enhancementSummary.newlyEnhanced.length}</div>
            <div style="font-size: 12px; opacity: 0.8;">Newly Enhanced Modes</div>
          </div>
        </div>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">
          🎯 Newly enhanced modes: <strong>${comparison.enhancementSummary.newlyEnhanced.join(', ')}</strong>
        </p>
      </div>

      <!-- Statistics Section -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #8fdfff; font-size: 16px;">📏 Content Size</h4>
          <p><strong>Basic extraction:</strong> ${comparison.basicLength.toLocaleString()} characters</p>
          <p><strong>Enhanced extraction:</strong> ${comparison.enhancedLength.toLocaleString()} characters</p>
          <p style="color: #8fff8f;"><strong>Reduction:</strong> ${comparison.sizeReduction}% smaller</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #ffdf8f; font-size: 16px;">📝 Word Analysis</h4>
          <p><strong>Basic words:</strong> ${comparison.basicWordCount.toLocaleString()}</p>
          <p><strong>Enhanced words:</strong> ${comparison.enhancedWordCount.toLocaleString()}</p>
          <p style="color: #ff8f8f;"><strong>UI words removed:</strong> ${comparison.uiWordsFiltered.length}</p>
        </div>
      </div>

      <!-- Effectiveness Assessment -->
      <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #c8f7c5; font-size: 16px;">📈 Effectiveness Assessment</h4>
        <p style="margin: 0; line-height: 1.5;">${comparison.effectiveness}</p>
      </div>

      <!-- UI Elements Filtered -->
      ${comparison.uiWordsFiltered.length > 0 ? `
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0; color: #ff9999; font-size: 16px;">🧹 UI Elements Filtered Out</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${comparison.uiWordsFiltered.map(word => 
              `<span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${word}</span>`
            ).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Content Samples -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <!-- Basic content sample -->
        <div>
          <h4 style="margin: 0 0 12px 0; color: #ffcccc; font-size: 16px;">📄 Basic Content Sample</h4>
          <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; height: 150px; overflow-y: auto; line-height: 1.4;">
            ${comparison.basicSample.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        </div>

        <!-- Enhanced content sample -->
        <div>
          <h4 style="margin: 0 0 12px 0; color: #ccffcc; font-size: 16px;">✨ Enhanced Content Sample</h4>
          <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; height: 150px; overflow-y: auto; line-height: 1.4;">
            ${comparison.enhancedSample.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 24px; text-align: center; opacity: 0.7; font-size: 12px;">
        💡 Use Option+Click (Mac) or Alt+Click (Windows) on the LightUp global button to always show this debug info
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Auto-close after 30 seconds
  setTimeout(() => {
    if (popup && popup.parentNode) {
      popup.remove();
    }
  }, 30000);
};

export default debugContentExtraction;
