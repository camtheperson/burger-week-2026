import { describe, it, expect, vi } from 'vitest';
import { checkIfOpenNow, checkIfOpenAt } from '../../convex/utils/timeUtils';

describe('Backend Filter Logic', () => {
  describe('checkIfOpenNow function', () => {
    it('should correctly identify when a restaurant is open during business hours', () => {
      const hours = [
        {
          dayOfWeek: 'Tuesday',
          date: '2025-09-30',
          hours: '11 am–10 pm',
          fullDate: '2025-09-30'
        }
      ];
      
      // Mock current time to be 3 PM PDT on Sept 30 (which is 10 PM UTC)
      vi.setSystemTime(new Date('2025-09-30T22:00:00.000Z'));
      
      expect(checkIfOpenNow(hours)).toBe(true);
    });

    it('should correctly identify when a restaurant is closed', () => {
      const hours = [
        {
          dayOfWeek: 'Tuesday',
          date: '2025-09-30',
          hours: '11 am–10 pm',
          fullDate: '2025-09-30'
        }
      ];
      
      // Mock current time to be 11:30 PM PDT on Sept 30 (which is 6:30 AM UTC on Oct 1)
      vi.setSystemTime(new Date('2025-10-01T06:30:00.000Z'));
      
      expect(checkIfOpenNow(hours)).toBe(false);
    });

    it('should handle overnight hours correctly', () => {
      const hours = [
        {
          dayOfWeek: 'Friday',
          date: '2025-10-03',
          hours: '11 pm–2 am',
          fullDate: '2025-10-03'
        }
      ];
      
      // Mock current time to be 12:30 AM PDT on Oct 4 (which is 7:30 AM UTC on Oct 4)
      vi.setSystemTime(new Date('2025-10-04T07:30:00.000Z'));
      
      expect(checkIfOpenNow(hours)).toBe(true);
    });

    it('should return false for restaurants marked as closed', () => {
      const hours = [
        {
          dayOfWeek: 'Tuesday',
          date: '2025-09-30',
          hours: 'Closed',
          fullDate: '2025-09-30'
        }
      ];
      
      vi.setSystemTime(new Date('2025-09-30T22:00:00.000Z'));
      
      expect(checkIfOpenNow(hours)).toBe(false);
    });

    it('should handle simplified time format like "4–10 pm"', () => {
      const hours = [
        {
          dayOfWeek: 'Tuesday',
          date: '2025-09-30',
          hours: '4–10 pm',
          fullDate: '2025-09-30'
        }
      ];
      
      // Mock current time to be 6 PM PDT on Sept 30 (which is 1 AM UTC on Oct 1)
      vi.setSystemTime(new Date('2025-10-01T01:00:00.000Z'));
      
      expect(checkIfOpenNow(hours)).toBe(true);
    });
  });

  describe('Filter Integration Scenarios', () => {
    it('should handle edge case: restaurant opening exactly at midnight', () => {
      const hours = [
        {
          dayOfWeek: 'Saturday',
          date: '2025-10-04',
          hours: '12 am–2 am',
          fullDate: '2025-10-04'
        }
      ];
      
      // Mock current time to be exactly midnight PDT on Oct 4
      vi.setSystemTime(new Date('2025-10-04T07:00:00.000Z')); // 12 AM PDT = 7 AM UTC
      
      expect(checkIfOpenNow(hours)).toBe(true);
    });

    it('should handle edge case: restaurant closing exactly at midnight', () => {
      const hours = [
        {
          dayOfWeek: 'Saturday',
          date: '2025-10-04',
          hours: '10 pm–12 am',
          fullDate: '2025-10-04'
        }
      ];
      
      // Mock current time to be exactly midnight PDT on Oct 5
      vi.setSystemTime(new Date('2025-10-05T07:00:00.000Z')); // 12 AM PDT = 7 AM UTC
      
      // Should be open since midnight is still within the "10 pm–12 am" range
      // (The restaurant is open through midnight, closing at the end of that minute)
      expect(checkIfOpenNow(hours)).toBe(true);
    });

    it('should return false when no hours are available for the current date', () => {
      const hours = [
        {
          dayOfWeek: 'Monday',
          date: '2025-09-29',
          hours: '11 am–10 pm',
          fullDate: '2025-09-29'
        }
      ];
      
      // Mock current time to be Tuesday (different day)
      vi.setSystemTime(new Date('2025-09-30T22:00:00.000Z'));
      
      expect(checkIfOpenNow(hours)).toBe(false);
    });
  });

  describe('checkIfOpenAt function', () => {
    it('should correctly identify when a restaurant is open at a specific date and time', () => {
      const hours = [
        {
          dayOfWeek: 'Tuesday',
          date: '2025-09-30',
          hours: '11 am–10 pm',
          fullDate: '2025-09-30'
        }
      ];
      
      expect(checkIfOpenAt(hours, '2025-09-30', '15:00')).toBe(true); // 3 PM
    });

    it('should correctly identify when a restaurant is closed at a specific date and time', () => {
      const hours = [
        {
          dayOfWeek: 'Tuesday',
          date: '2025-09-30',
          hours: '11 am–10 pm',
          fullDate: '2025-09-30'
        }
      ];
      
      expect(checkIfOpenAt(hours, '2025-09-30', '23:30')).toBe(false); // 11:30 PM
    });

    it('should handle overnight hours correctly for specific date and time', () => {
      const hours = [
        {
          dayOfWeek: 'Friday',
          date: '2025-10-03',
          hours: '11 pm–2 am',
          fullDate: '2025-10-03'
        }
      ];
      
      expect(checkIfOpenAt(hours, '2025-10-04', '01:30')).toBe(true); // 1:30 AM on next day
    });

    it('should return false when no hours are available for the target date', () => {
      const hours = [
        {
          dayOfWeek: 'Monday',
          date: '2025-09-29',
          hours: '11 am–10 pm',
          fullDate: '2025-09-29'
        }
      ];
      
      expect(checkIfOpenAt(hours, '2025-09-30', '15:00')).toBe(false);
    });
  });
});