/**
 * Pure utility — NOT a Server Action.
 * Calculates attendance deduction and notes for a single attendance row.
 * @param {object} row - The attendance row (with check_in, break_start, break_end)
 * @param {string} targetDate - "YYYY-MM-DD"
 * @returns {{ deduction: number, deduction_notes: string }}
 */
export function calcDeduction(row, targetDate) {
  let deduction = 0;
  const notes = [];
  const now = new Date();

  // 1. Check-in lateness (scheduled 09:00)
  if (row.check_in) {
    const checkInTime = new Date(row.check_in);
    // Build scheduled time in the same date as the check_in timestamp
    const scheduled = new Date(checkInTime);
    scheduled.setHours(9, 0, 0, 0);

    const diffMins = Math.floor((checkInTime - scheduled) / (1000 * 60));
    if (diffMins > 0) {
      if (diffMins <= 15) {
        deduction += 5000;
        notes.push(`Telat ${diffMins}m`);
      } else if (diffMins <= 30) {
        deduction += 10000;
        notes.push(`Telat ${diffMins}m`);
      } else {
        deduction += 15000;
        notes.push(`Telat ${diffMins}m`);
      }
    }
  } else {
    // No check-in — apply Rp20.000 if today past 09:00 or if past date
    const limit = new Date(targetDate);
    limit.setHours(9, 0, 0, 0);
    const targetDay = new Date(targetDate);
    const isToday = targetDay.toDateString() === now.toDateString();

    if (!isToday || now > limit) {
      deduction += 20000;
      notes.push("Tidak absen pagi");
    }
  }

  // 2. Missing break_end (break_start exists but didn't return from break)
  if (row.break_start && !row.break_end) {
    const breakLimit = new Date(targetDate);
    breakLimit.setHours(14, 0, 0, 0);
    const targetDay = new Date(targetDate);
    const isToday = targetDay.toDateString() === now.toDateString();

    if (!isToday || now > breakLimit) {
      deduction += 20000;
      notes.push("Tidak absen habis istirahat");
    }
  }

  return { deduction, deduction_notes: notes.join(", ") };
}
