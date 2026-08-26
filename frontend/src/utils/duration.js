/**
 * Calculate the difference (inclusive) between two dates and format it.
 * Format examples:
 * - 1 day
 * - 5 days
 * - 7 days -> 1 week
 * - 9 days -> 1 week 2 days
 * - 14 days -> 2 weeks
 * - 30 days -> 1 month
 * - 35 days -> 1 month 5 days
 * - 74 days -> 2 months 2 weeks
 * 
 * @param {string} startDateStr - Start date (YYYY-MM-DD)
 * @param {string} endDateStr - End date (YYYY-MM-DD)
 * @returns {string} Formatted duration string
 */
export function calculateDuration(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return "";
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
  
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return "";
  
  // Calculate difference in days (inclusive)
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return formatDays(diffDays);
}

function formatDays(totalDays) {
  if (totalDays <= 0) return "";
  
  let days = totalDays;
  
  const years = Math.floor(days / 365);
  days %= 365;

  const months = Math.floor(days / 30);
  days %= 30;
  
  const weeks = Math.floor(days / 7);
  days %= 7;
  
  const parts = [];
  
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }
  
  if (weeks > 0) {
    parts.push(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`);
  }
  
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  
  return parts.join(' ');
}
