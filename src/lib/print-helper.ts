
'use client';

// This function grabs all the CSS rules from the current document.
// This is how we get the compiled Tailwind styles into the print window
// without needing to link to external files.
const getDocumentStyles = (): string => {
  let css = [];
  for (const sheet of Array.from(document.styleSheets)) {
    // We try-catch because we can't access cssRules for cross-origin stylesheets.
    try {
      if (sheet.cssRules) {
        for (const rule of Array.from(sheet.cssRules)) {
          css.push(rule.cssText);
        }
      }
    } catch (e) {
      console.warn("Could not read stylesheet for printing:", sheet.href);
    }
  }
  return css.join('\n');
};

/**
 * Opens a new window with the given HTML content for previewing before printing.
 * The user can then use the browser's native print functionality (Ctrl+P or Cmd+P).
 * This function does not force orientation or paper size.
 * @param content The HTML content string to display in the new window.
 * @param title The title for the new window's tab.
 */
export const openPrintWindow = (content: string, title: string) => {
  try {
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      // Get the current document's styles. This includes Tailwind's compiled CSS and global styles.
      const compiledStyles = getDocumentStyles();
    
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
              ${compiledStyles}
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus(); // Focus the new tab for the user.
    } else {
      // This error is important for UX if popups are blocked.
      alert('Could not open a new window. Please disable your popup blocker for this site and try again.');
    }
  } catch (error) {
    console.error('Error preparing print window:', error);
    alert('An unexpected error occurred while trying to prepare the print page.');
  }
};
