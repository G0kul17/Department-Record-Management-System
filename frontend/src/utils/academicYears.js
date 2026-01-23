/**
 * Generate academic year options dynamically based on current date
 * @param {number} yearsBack - How many years to go back (default: 10)
 * @param {number} yearsFuture - How many years to go forward (default: 2)
 * @returns {Array<{value: string, label: string}>} Array of academic year options
 */
export function generateAcademicYears(yearsBack = 10, yearsFuture = 2) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  // Determine the current academic year start
  // Academic year typically starts in July-August (month 6-7)
  // If we're in Jan-June, the academic year started last year
  const currentAcademicYearStart = currentMonth < 6 ? currentYear - 1 : currentYear;
  
  const years = [];
  
  // Generate from past to future
  for (let i = -yearsBack; i <= yearsFuture; i++) {
    const startYear = currentAcademicYearStart + i;
    const endYear = startYear + 1;
    years.push({
      value: `${startYear}-${endYear}`,
      label: `${startYear}-${endYear}`
    });
  }
  
  // Return in reverse order (newest first)
  return years.reverse();
}

/**
 * Get current academic year string
 * @returns {string} Current academic year in format "YYYY-YYYY"
 */
export function getCurrentAcademicYear() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth < 6 ? currentYear - 1 : currentYear;
  return `${startYear}-${startYear + 1}`;
}
