/**
 * Returns the current date as a string in the format "DD.MM.YYYY".
 *
 * @returns {string} The current date as a string in the format "DD.MM.YYYY".
 */
export function getFullCurrentDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    return `${day}.${month}.${year}`;
}

/**
 * Takes an ISO string and returns a string representing the date in the format "DD.MM.YYYY".
 *
 * @param {string} isoString - The ISO string to parse.
 *
 * @returns {string} A string representing the date in the format "DD.MM.YYYY".
 */
export function formatDate(isoString) {
    let date = new Date(isoString);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();

    return `${day}.${month}.${year}`
}