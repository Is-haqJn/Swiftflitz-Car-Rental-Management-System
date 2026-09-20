import { Form } from 'react-bootstrap';

/* Types */
export interface HourSelectProps {
    /** Current value in "HH:00" 24-hour format (e.g. "08:00", "20:00") */
    value: string;
    onChange: (value: string) => void;
    /** Inclusive lower bound - hours below this are hidden (0–23, default 0) */
    minHour?: number;
    /** Inclusive upper bound - hours above this are hidden (0–23, default 23) */
    maxHour?: number;
    placeholder?: string;
    disabled?: boolean;
    isInvalid?: boolean;
    className?: string;
}

/* Helpers */
/** Format an hour (0–23) as a 12-hour display label (e.g. 0 → "12:00 AM", 13 → "1:00 PM") */
function formatHourLabel(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
}

/** Pad hour to "HH:00" value string */
function toValue(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
}

interface Group {
    label: string;
    hours: number[];
}

const ALL_GROUPS: Group[] = [
    { label: 'Morning', hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { label: 'Afternoon', hours: [12, 13, 14, 15] },
    { label: 'Evening', hours: [16, 17, 18, 19, 20, 21, 22, 23] },
];

/* Component */
export default function HourSelect({
    value,
    onChange,
    minHour = 0,
    maxHour = 23,
    placeholder = 'Select time...',
    disabled = false,
    isInvalid = false,
    className,
}: HourSelectProps) {
    const groups = ALL_GROUPS.map(group => ({
        ...group,
        hours: group.hours.filter(h => h >= minHour && h <= maxHour),
    })).filter(group => group.hours.length > 0);

    return (
        <Form.Select
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            isInvalid={isInvalid}
            className={className}
        >
            <option value="" disabled>
                {placeholder}
            </option>
            {groups.map(group => (
                <optgroup key={group.label} label={group.label}>
                    {group.hours.map(hour => (
                        <option key={hour} value={toValue(hour)}>
                            {formatHourLabel(hour)}
                        </option>
                    ))}
                </optgroup>
            ))}
        </Form.Select>
    );
}
