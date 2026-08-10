// Time utility functions for client-side use (adapted from Convex timeUtils)

export interface LocationHours {
  dayOfWeek: string;
  date: string;
  hours: string;
  fullDate: string;
}

// Helper function to check if location is open now
export function checkIfOpenNow(hours: Array<LocationHours>): boolean {
  if (!hours || hours.length === 0) return false;
  
  // Get current time in Pacific Time (Portland timezone)
  // UTC-8 (PST) or UTC-7 (PDT) - since it's October, it's still PDT (UTC-7)
  const now = new Date();
  // Convert to Pacific Time by subtracting 7 hours (PDT offset)
  const pacificTime = new Date(now.getTime() - (7 * 60 * 60 * 1000));
  const currentDate = pacificTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find today's hours - for overnight hours, we might need to check yesterday's hours too
  let todayHours = hours.find(h => h.fullDate === currentDate);
  
  // If no hours found for today and it's early morning (before 6 AM), 
  // check yesterday's hours for overnight service
  if (!todayHours && pacificTime.getUTCHours() < 6) {
    const yesterday = new Date(pacificTime.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    todayHours = hours.find(h => h.fullDate === yesterdayDate);
  }
  
  if (!todayHours) return false;

  // Parse hours string (e.g., "12–10 pm", "11 am–11 pm", "Closed")
  const hoursStr = todayHours.hours;
  if (hoursStr.toLowerCase().includes('closed')) return false;
  
  try {
    // Extract start and end times - handle formats like "4–10 pm", "11 am–9 pm", "11:30 am–9 pm"
    let timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    let match = hoursStr.match(timeRegex);
    let startHour, startMin, startAmPm, endHour, endMin, endAmPm;
    
    if (match) {
      [, startHour, startMin = '0', startAmPm, endHour, endMin = '0', endAmPm] = match;
    } else {
      // Try simplified format like "4–10 pm" or "12–8 pm" where start time inherits am/pm from end time
      timeRegex = /(\d{1,2})(?::(\d{2}))?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
      match = hoursStr.match(timeRegex);
      if (match) {
        [, startHour, startMin = '0', endHour, endMin = '0', endAmPm] = match;
        // For simplified format, assume start time is in same period as end time unless it's clearly different
        startAmPm = endAmPm;
      } else {
        return false;
      }
    }
    
    // Convert to 24-hour format
    let start24 = parseInt(startHour);
    let end24 = parseInt(endHour);
    
    if (startAmPm.toLowerCase() === 'pm' && start24 !== 12) start24 += 12;
    if (startAmPm.toLowerCase() === 'am' && start24 === 12) start24 = 0;
    if (endAmPm.toLowerCase() === 'pm' && end24 !== 12) end24 += 12;
    if (endAmPm.toLowerCase() === 'am' && end24 === 12) end24 = 0;
    
    const startTime = start24 * 60 + parseInt(startMin);
    const endTime = end24 * 60 + parseInt(endMin);
    const currentTime = pacificTime.getUTCHours() * 60 + pacificTime.getUTCMinutes();
    
    // Handle overnight hours (e.g., 11 PM - 2 AM)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  } catch {
    return false;
  }
}

// Helper function to check if location is open at a specific date and time
export function checkIfOpenAt(hours: Array<LocationHours>, targetDate: string, targetTime: string): boolean {
  if (!hours || hours.length === 0) return false;
  
  // Find hours for the target date
  let targetHours = hours.find(h => h.fullDate === targetDate);
  
  // If no hours found for target date and it's early morning time (before 6 AM), 
  // check previous day's hours for overnight service
  const [targetHour] = targetTime.split(':').map(Number);
  if (!targetHours && targetHour < 6) {
    const prevDay = new Date(targetDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayDate = prevDay.toISOString().split('T')[0];
    targetHours = hours.find(h => h.fullDate === prevDayDate);
  }
  
  if (!targetHours) return false;

  // Parse hours string (e.g., "12–10 pm", "11 am–11 pm", "Closed")
  const hoursStr = targetHours.hours;
  if (hoursStr.toLowerCase().includes('closed')) return false;
  
  try {
    // Extract start and end times - handle formats like "4–10 pm", "11 am–9 pm", "11:30 am–9 pm"
    let timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    let match = hoursStr.match(timeRegex);
    let startHour, startMin, startAmPm, endHour, endMin, endAmPm;
    
    if (match) {
      [, startHour, startMin = '0', startAmPm, endHour, endMin = '0', endAmPm] = match;
    } else {
      // Try simplified format like "4–10 pm" or "12–8 pm" where start time inherits am/pm from end time
      timeRegex = /(\d{1,2})(?::(\d{2}))?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
      match = hoursStr.match(timeRegex);
      if (match) {
        [, startHour, startMin = '0', endHour, endMin = '0', endAmPm] = match;
        // For simplified format, assume start time is in same period as end time unless it's clearly different
        startAmPm = endAmPm;
      } else {
        return false;
      }
    }
    
    // Convert to 24-hour format
    let start24 = parseInt(startHour);
    let end24 = parseInt(endHour);
    
    if (startAmPm.toLowerCase() === 'pm' && start24 !== 12) start24 += 12;
    if (startAmPm.toLowerCase() === 'am' && start24 === 12) start24 = 0;
    if (endAmPm.toLowerCase() === 'pm' && end24 !== 12) end24 += 12;
    if (endAmPm.toLowerCase() === 'am' && end24 === 12) end24 = 0;
    
    const startTime = start24 * 60 + parseInt(startMin);
    const endTime = end24 * 60 + parseInt(endMin);
    
    // Parse target time (HH:MM format)
    const [targetHourNum, targetMinNum] = targetTime.split(':').map(Number);
    const targetTimeMinutes = targetHourNum * 60 + targetMinNum;
    
    // Handle overnight hours (e.g., 11 PM - 2 AM)
    if (endTime < startTime) {
      return targetTimeMinutes >= startTime || targetTimeMinutes <= endTime;
    }
    
    return targetTimeMinutes >= startTime && targetTimeMinutes <= endTime;
  } catch {
    return false;
  }
}