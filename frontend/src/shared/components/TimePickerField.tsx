import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';

/* Types */
interface TimePickerFieldProps {
    /** HH:mm string value (24-hour) */
    value: string;
    onChange: (value: string) => void;
    isInvalid?: boolean;
    placeholder?: string;
    disabled?: boolean;
    /** Minutes between time options - default 15 */
    timeIntervals?: number;
}

/* Clock SVG icon */
function ClockIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

/* Custom Bootstrap-styled input */
interface CustomInputProps {
    value?: string;
    onClick?: () => void;
    isInvalid?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

const BootstrapTimeInput = forwardRef<HTMLDivElement, CustomInputProps>(
    ({ value, onClick, isInvalid, placeholder, disabled }, ref) => (
        <div ref={ref} className="input-group sfz-datepicker-input">
            <input
                readOnly
                value={value ?? ''}
                placeholder={placeholder ?? 'Select time'}
                disabled={disabled}
                onClick={onClick}
                className={`form-control ${isInvalid ? 'is-invalid' : ''}`}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
            />
            <span
                className="input-group-text"
                onClick={onClick}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
            >
                <ClockIcon />
            </span>
        </div>
    )
);
BootstrapTimeInput.displayName = 'BootstrapTimeInput';

/* Main Component */
export default function TimePickerField({
    value,
    onChange,
    isInvalid = false,
    placeholder,
    disabled = false,
    timeIntervals = 15,
}: TimePickerFieldProps) {
    const parseTime = (str: string): Date | null => {
        if (!str) return null;
        const d = parse(str, 'HH:mm', new Date());
        return isValid(d) ? d : null;
    };

    const selected = parseTime(value);

    const handleChange = (date: Date | null) => {
        onChange(date ? format(date, 'HH:mm') : '');
    };

    return (
        <ReactDatePicker
            selected={selected}
            onChange={handleChange}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={timeIntervals}
            timeCaption="Time"
            dateFormat="h:mm aa"
            disabled={disabled}
            placeholderText={placeholder ?? 'Select time'}
            popperPlacement="bottom-start"
            customInput={
                <BootstrapTimeInput
                    isInvalid={isInvalid}
                    placeholder={placeholder ?? 'Select time'}
                    disabled={disabled}
                />
            }
        />
    );
}
