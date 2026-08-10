import type { LocationHour } from '../types';

interface RestaurantHoursProps {
  hours?: LocationHour[];
  compact?: boolean;
}

export default function RestaurantHours({ hours, compact = false }: RestaurantHoursProps) {
  if (!hours || hours.length === 0) return null;

  if (compact) {
    return (
      <div className="text-xs text-gray-600">
        <span className="font-medium">Today: </span>
        {hours[0] && hours[0].hours}
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
        🕒 Hours
      </h4>
      <div className="space-y-3">
        {hours.map((hour, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="font-medium text-gray-900">
              {hour.dayOfWeek} {hour.date}
            </span>
            <span className="text-gray-600 font-medium">{hour.hours}</span>
          </div>
        ))}
      </div>
    </div>
  );
}