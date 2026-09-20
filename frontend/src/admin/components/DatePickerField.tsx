import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

/* Types */
interface DatePickerFieldProps {
    /** YYYY-MM-DD string value (react-hook-form compatible) */
    value: string;
    onChange: (value: string) => void;
    isInvalid?: boolean;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
    /** e.g. 'dd MMM yyyy' - defaults to that */
    displayFormat?: string;
    /** Date ranges to grey out / disable in the calendar (e.g. existing bookings) */
    excludeDateIntervals?: Array<{ start: Date; end: Date }>;
    /** Individual dates to grey out / disable in the calendar */
    excludeDates?: Date[];
}

/* Custom Bootstrap-styled input */
interface CustomInputProps {
    value?: string;
    onClick?: () => void;
    isInvalid?: boolean;
    placeholder?: string;
    disabled?: boolean;
    onClear?: () => void;
}

const BootstrapDateInput = forwardRef<HTMLDivElement, CustomInputProps>(
    ({ value, onClick, isInvalid, placeholder, disabled, onClear }, ref) => (
        <div
            ref={ref}
            className={`input-group sfz-datepicker-input ${isInvalid ? 'is-invalid-group' : ''}`}
        >
            <input
                readOnly
                value={value ?? ''}
                placeholder={placeholder ?? 'Select date'}
                disabled={disabled}
                onClick={onClick}
                className={`form-control ${isInvalid ? 'is-invalid' : ''}`}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
            />
            {value && !disabled && onClear && (
                <button
                    type="button"
                    className="input-group-text btn-clear-date"
                    onClick={e => {
                        e.stopPropagation();
                        onClear();
                    }}
                    tabIndex={-1}
                    aria-label="Clear date"
                >
                    ×
                </button>
            )}
            <span
                className="input-group-text"
                onClick={onClick}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
            >
                <i className="flaticon-calendar" />
            </span>
        </div>
    )
);
BootstrapDateInput.displayName = 'BootstrapDateInput';

/* Main Component */
export default function DatePickerField({
    value,
    onChange,
    isInvalid = false,
    placeholder,
    minDate,
    maxDate,
    disabled = false,
    displayFormat = 'dd MMM yyyy',
    excludeDateIntervals,
    excludeDates,
}: DatePickerFieldProps) {
    const parseDate = (str: string): Date | null => {
        if (!str) return null;
        const d = parse(str, 'yyyy-MM-dd', new Date());
        return isValid(d) ? d : null;
    };

    const selected = parseDate(value);

    const handleChange = (date: Date | null) => {
        onChange(date ? format(date, 'yyyy-MM-dd') : '');
    };

    return (
        <ReactDatePicker
            selected={selected}
            onChange={handleChange}
            dateFormat={displayFormat}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            placeholderText={placeholder ?? 'Select date'}
            popperPlacement="bottom-start"
            excludeDateIntervals={excludeDateIntervals}
            excludeDates={excludeDates}
            customInput={
                <BootstrapDateInput
                    isInvalid={isInvalid}
                    placeholder={placeholder ?? 'Select date'}
                    disabled={disabled}
                    onClear={() => handleChange(null)}
                />
            }
        />
    );
}
