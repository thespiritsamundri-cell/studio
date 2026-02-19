
'use client';

// Function to get all computed styles from the document to apply them to the print window.
const getDocumentStyles = (): string => {
  let css = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.href && sheet.href.indexOf(window.location.origin) !== 0) {
        continue;
      }
      if (sheet.cssRules) {
        for (const rule of Array.from(sheet.cssRules)) {
          css.push(rule.cssText);
        }
      }
    } catch (e) {
      // Silently ignore CORS errors on external stylesheets
    }
  }
  return css.join('\n');
};

/**
 * Opens a new window with the given content for printing.
 * The browser's default print dialog can then be used by the user manually.
 * @param content The HTML content to display in the new window.
 * @param title The title for the new window.
 */
export const openPrintWindow = (content: string, title: string) => {
  try {
    const compiledStyles = getDocumentStyles();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>${compiledStyles}</style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus(); // Focus the new tab
    } else {
      console.error('Failed to open print window. Please check your browser popup settings.');
      alert('Could not open print window. Please check your browser\'s popup blocker settings.');
    }
  } catch (error) {
    console.error('Error opening print window:', error);
    alert('An error occurred while trying to open the print window.');
  }
};
