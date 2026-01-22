/**
 * Shared parsers for business data transformation
 * Used by both server actions and client-side import logic
 */

/**
 * Convert 12-hour time format to 24-hour format
 * "9:00 AM" -> "09:00", "10:30 PM" -> "22:30"
 */
export function convertTo24Hour(time12h: string): string {
    const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time12h;

    let [, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);

    if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Parse Google's weekdayText format to structured OperatingHours
 * Input: ["Monday: 9:00 AM – 10:00 PM", "Tuesday: Closed", ...]
 * Output: OperatingHours with WeeklySchedule
 */
export function parseOperatingHoursFromGoogle(weekdayText: string[]): any {
    if (!weekdayText || weekdayText.length === 0) {
        return undefined;
    }

    const dayMapping: Record<string, string> = {
        'Monday': 'monday',
        'Tuesday': 'tuesday',
        'Wednesday': 'wednesday',
        'Thursday': 'thursday',
        'Friday': 'friday',
        'Saturday': 'saturday',
        'Sunday': 'sunday'
    };

    const schedule: Record<string, any> = {};
    let isOpen24x7 = true;
    let hasAnyHours = false;

    weekdayText.forEach(dayText => {
        // Parse: "Monday: 9:00 AM – 10:00 PM" or "Monday: Closed" or "Monday: Open 24 hours"
        const match = dayText.match(/^(\w+):\s*(.+)$/);
        if (!match) return;

        const [, dayName, hoursStr] = match;
        const dayKey = dayMapping[dayName];
        if (!dayKey) return;

        if (hoursStr.toLowerCase() === 'closed') {
            schedule[dayKey] = { isOpen: false };
            isOpen24x7 = false;
            hasAnyHours = true;
        } else if (hoursStr.toLowerCase().includes('open 24 hours')) {
            schedule[dayKey] = { isOpen: true, openTime: '00:00', closeTime: '23:59' };
            hasAnyHours = true;
        } else {
            // Parse time range: "9:00 AM – 10:00 PM"
            const timeMatch = hoursStr.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*[–-]\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
            if (timeMatch) {
                isOpen24x7 = false;
                hasAnyHours = true;
                schedule[dayKey] = {
                    isOpen: true,
                    openTime: convertTo24Hour(timeMatch[1]),
                    closeTime: convertTo24Hour(timeMatch[2])
                };
            }
        }
    });

    if (!hasAnyHours) {
        return undefined;
    }

    // Fill in missing days with closed
    Object.values(dayMapping).forEach(day => {
        if (!schedule[day]) {
            schedule[day] = { isOpen: false };
        }
    });

    return {
        isOpen24x7,
        schedule,
        specialNote: isOpen24x7 ? 'Open 24/7' : null
    };
}

/**
 * Parse address from imported data to BusinessAddress format
 */
export function parseAddress(address: any): any {
    if (!address) return undefined;

    // If it's already properly structured
    if (typeof address === 'object') {
        return {
            street: address.street || address.line1 || address.formattedAddress || '',
            area: address.area || address.locality || address.neighborhood || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || address.pincode || address.zip || '',
            country: address.country || '',
            googleMapsUrl: address.googleMapsUrl || '',
        };
    }

    // If it's a string, use as street
    if (typeof address === 'string') {
        return {
            street: address,
            area: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            googleMapsUrl: ''
        };
    }

    return undefined;
}

