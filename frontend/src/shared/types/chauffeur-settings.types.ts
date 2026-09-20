export interface PublicChauffeurSettings {
    booking_window_start: string;
    booking_window_end: string;
    vat_rate: number;
}

export interface ChauffeurSettings {
    grace_period_minutes: number;
    cancellation_flat_fee: number;
    overtime_charge_per_hour: number;
    no_show_fee: number;
    /** HH:mm - all bookings are expected back by this time; overtime starts after it */
    standard_return_time: string;
    /** HH:mm - earliest hour a pickup can be scheduled */
    booking_window_start: string;
    /** HH:mm - latest hour a pickup can be scheduled */
    booking_window_end: string;
}

export type UpdateChauffeurSettingsData = ChauffeurSettings;
