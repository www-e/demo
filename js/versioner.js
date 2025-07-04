// js/versioner.js

/**
 * Creates a unique version string based on the CURRENT MINUTE.
 * The version will change every minute, ensuring rapid cache busting for urgent updates.
 * Format: YYYYMMDDHHMM (e.g., 202407281432 for July 28, 2024 at 2:32 PM)
 * This forces browsers to download a new script version very frequently.
 * @returns {string} A per-minute version string.
 */
function getMinuteVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // padStart ensures '07', not '7'
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}`;
}

/**
 * Finds all script tags in the document that have a 'data-versioned' attribute
 * and appends the per-minute version string to their 'src' attribute.
 */
function applyVersioning() {
    const version = getMinuteVersion();
    const scriptsToVersion = document.querySelectorAll('script[data-versioned]');
    
    scriptsToVersion.forEach(script => {
        const originalSrc = script.getAttribute('src');
        if (originalSrc) {
            // Use URL to safely handle existing query parameters, though we are replacing 'v'
            const url = new URL(script.src, window.location.origin);
            url.searchParams.set('v', version); // Use .set() to add or replace the version
            script.src = url.toString();
        }
    });
    console.log(`Per-minute versioning applied. Current version key: ${version}`);
}

// Run the versioning logic as soon as this script is executed.
applyVersioning();