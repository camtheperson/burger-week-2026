import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkIfOpenNow } from '../../convex/utils/timeUtils';

describe('checkIfOpenNow', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.restoreAllMocks();
  });

  it('should return false for empty hours array', () => {
    expect(checkIfOpenNow([])).toBe(false);
  });

  it('should return false when no hours for today', () => {
    const hours = [
      {
        dayOfWeek: 'Monday',
        date: '2025-09-29',
        hours: '11 am–10 pm',
        fullDate: '2025-09-29'
      }
    ];
    
    // Mock current date to be different day
    const mockDate = new Date('2025-09-30T15:00:00.000Z'); // Tuesday 3 PM UTC
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(false);
  });

  it('should return false when restaurant is closed', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: 'Closed',
        fullDate: '2025-09-30'
      }
    ];
    
    const mockDate = new Date('2025-09-30T15:00:00.000Z'); // Tuesday 3 PM UTC (8 AM PDT)
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(false);
  });

  it('should return true when restaurant is open (standard hours)', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: '11 am–10 pm',
        fullDate: '2025-09-30'
      }
    ];
    
    // Mock current time to be 3 PM PDT (10 PM UTC)
    const mockDate = new Date('2025-09-30T22:00:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(true);
  });

  it('should return false when restaurant is closed (before opening)', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: '11 am–10 pm',
        fullDate: '2025-09-30'
      }
    ];
    
    // Mock current time to be 9 AM PDT (4 PM UTC)
    const mockDate = new Date('2025-09-30T16:00:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(false);
  });

  it('should return false when restaurant is closed (after closing)', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: '11 am–10 pm',
        fullDate: '2025-09-30'
      }
    ];
    
    // Mock current time to be 11 PM PDT (6 AM UTC next day)
    const mockDate = new Date('2025-10-01T06:00:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(false);
  });

  it('should handle simplified format like "4–10 pm"', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: '4–10 pm',
        fullDate: '2025-09-30'
      }
    ];
    
    // Mock current time to be 6 PM PDT on Sept 30 (which is 1 AM UTC on Oct 1)
    const mockDate = new Date('2025-10-01T01:00:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(true);
  });

  it('should handle overnight hours', () => {
    const hours = [
      {
        dayOfWeek: 'Friday',
        date: '2025-10-03',
        hours: '11 pm–2 am',
        fullDate: '2025-10-03'
      }
    ];
    
    // Mock current time to be 12:30 AM PDT on Oct 4 (which is 7:30 AM UTC on Oct 4)
    // This means it's 12:30 AM on Saturday (the night that started on Friday)
    const mockDate = new Date('2025-10-04T07:30:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(true);
  });

  it('should handle hours with minutes', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: '11:30 am–9:30 pm',
        fullDate: '2025-09-30'
      }
    ];
    
    // Mock current time to be 2:15 PM PDT (9:15 PM UTC)
    const mockDate = new Date('2025-09-30T21:15:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(true);
  });

  it('should return false for malformed hours string', () => {
    const hours = [
      {
        dayOfWeek: 'Tuesday',
        date: '2025-09-30',
        hours: 'Invalid format',
        fullDate: '2025-09-30'
      }
    ];
    
    const mockDate = new Date('2025-09-30T22:00:00.000Z'); 
    vi.setSystemTime(mockDate);
    
    expect(checkIfOpenNow(hours)).toBe(false);
  });
});