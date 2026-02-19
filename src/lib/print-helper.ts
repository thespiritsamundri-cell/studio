'use client';

// Function to get all computed styles from the document
const getDocumentStyles = (): string => {
  let css = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      // For some external stylesheets, accessing cssRules can throw a security error.
      if (sheet.href && sheet.href.indexOf(window.location.origin) !== 0) {
        continue;
      }
      if (sheet.cssRules) {
        for (const rule of Array.from(sheet.cssRules)) {
          css.push(rule.cssText);
        }
      }
    } catch (e) {
      console.warn('Could not read stylesheet rules:', e);
    }
  }
  return css.join('\n');
};

/**
 * Opens a new window with the given content and styles for printing.
 * @param content The HTML content to print.
 * @param title The title of the print window.
 * @param customStylesheetPath Optional path to a custom stylesheet for print-specific rules (e.g., @page).
 */
export const openPrintWindow = (content: string, title: string, customStylesheetPath?: string) => {
  try {
    const compiledStyles = getDocumentStyles();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>${compiledStyles}</style>
            ${customStylesheetPath ? `<link rel="stylesheet" href="${customStylesheetPath}">` : ''}
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      console.error('Failed to open print window. Please check your browser popup settings.');
    }
  } catch (error) {
    console.error('Error opening print window:', error);
  }
};
