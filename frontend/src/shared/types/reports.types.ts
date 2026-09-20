import type { ApiResponse } from './common.types';

/* Shared */
export interface ReportPeriod {
    start: string;
    end: string;
}

export interface ReportFilters {
    start_date?: string;
    end_date?: string;
    period?: string;
    branch_id?: string;
    [key: string]: string | number | boolean | undefined;
}

/* Revenue Report */
export interface RevenueSummary {
    gross_revenue: number;
    collected_revenue: number;
    refunded_amount: number;
    net_revenue: number;
    outstanding_balance: number;
    collection_rate: number;
    total_rentals: number;
    average_per_rental: number;
}

export interface DailyRevenueRow {
    date: string;
    revenue: number;
    /** Number of payment transactions collected on this date */
    transaction_count: number;
    /** @deprecated use transaction_count */
    count?: number;
}

export interface RevenueReportData {
    period: ReportPeriod;
    /** Explains the date basis difference between gross/outstanding vs collected/refunded */
    period_note?: string;
    summary: RevenueSummary;
    chart: DailyRevenueRow[];
}

export type RevenueReportResponse = ApiResponse<RevenueReportData>;

/* Vehicles Report */
export interface VehiclesSummary {
    total_vehicles: number;
    available_count: number;
    rented_count: number;
    maintenance_count: number;
    average_utilization: number;
}

export interface VehicleReportRow {
    id: number;
    name: string;
    license_plate: string;
    category: string | null;
    status: string;
    total_rentals: number;
    completed_rentals: number;
    utilization_rate: number;
}

export interface VehiclesReportData {
    period: ReportPeriod;
    summary: VehiclesSummary;
    vehicles: VehicleReportRow[];
}

export type VehiclesReportResponse = ApiResponse<VehiclesReportData>;

/* Manager Performance Report */
export interface ManagerInfo {
    id: number | null;
    name: string | null;
    email: string | null;
}

export interface ManagerPerformanceRow {
    manager: ManagerInfo;
    total_rentals: number;
    completed_rentals: number;
    cancelled_rentals: number;
    total_revenue: number;
    completion_rate: number;
}

export interface ManagerPerformanceData {
    period: ReportPeriod;
    managers: ManagerPerformanceRow[];
}

export type ManagerPerformanceResponse = ApiResponse<ManagerPerformanceData>;

/* Outstanding Payments Report */
export interface OutstandingPaymentsSummary {
    total_outstanding: number;
    total_rentals: number;
    pending_count: number;
    partial_count: number;
}

export interface OutstandingRentalRow {
    id: number;
    reference: string;
    customer: { id: number; name: string; email: string } | null;
    vehicle: { id: number; name: string; license_plate: string } | null;
    total_cost: number;
    amount_paid: number;
    amount_due: number;
    payment_status: string;
    status: string;
    return_date: string | null;
    currency_symbol: string | null;
}

export interface OutstandingPaymentsData {
    summary: OutstandingPaymentsSummary;
    rentals: OutstandingRentalRow[];
}

export type OutstandingPaymentsResponse = ApiResponse<OutstandingPaymentsData>;

/* Maintenance Report */
export interface MaintenanceSummary {
    maintenance_count: number;
    damage_reports_count: number;
    total_estimated_damage: number;
    total_actual_damage: number;
}

export interface MaintenanceVehicleRow {
    id: number;
    name: string;
    license_plate: string;
    category: string | null;
    status: string;
}

export interface DamageReportRow {
    id: string;
    rental_reference: string | null;
    vehicle_name: string | null;
    license_plate: string | null;
    damage_types: string[];
    damage_severity: 'minor' | 'moderate' | 'severe' | null;
    estimated_cost: number | null;
    actual_cost: number | null;
    settlement_status: 'pending' | 'settled' | null;
    return_date: string | null;
}

export interface MaintenanceReportData {
    summary: MaintenanceSummary;
    maintenance_vehicles: MaintenanceVehicleRow[];
    damage_reports: DamageReportRow[];
}

export type MaintenanceReportResponse = ApiResponse<MaintenanceReportData>;

/* Customer Analysis Report */
export interface CustomerAnalysisSummary {
    total_customers: number;
    new_customers: number;
    blacklisted_count: number;
    expiring_licenses: number;
    expired_licenses: number;
}

export interface TopCustomerRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    rentals_count: number;
    total_spend: number;
    is_blacklisted: boolean;
}

export interface CustomerAnalysisData {
    period: ReportPeriod;
    summary: CustomerAnalysisSummary;
    top_customers: TopCustomerRow[];
}

export type CustomerAnalysisResponse = ApiResponse<CustomerAnalysisData>;

/* Vehicle Expense Report */
export interface VehicleExpenseRow {
    id: number;
    vehicle: string | null;
    license_plate: string | null;
    expense_type: string;
    description: string;
    amount: number;
    currency_symbol: string | null;
    expense_date: string;
    reference: string | null;
    recorded_by: string | null;
}

export interface VehicleExpenseSummary {
    total_expenses: number;
    total_records: number;
    by_type: Record<string, number>;
}

export interface VehicleExpenseByVehicle {
    vehicle: string | null;
    license_plate: string | null;
    total: number;
    count: number;
}

export interface VehicleExpensePagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface VehicleExpenseReportData {
    period: ReportPeriod;
    summary: VehicleExpenseSummary;
    by_vehicle: VehicleExpenseByVehicle[];
    expenses: VehicleExpenseRow[];
    expenses_pagination?: VehicleExpensePagination;
}

export type VehicleExpenseReportResponse =
    ApiResponse<VehicleExpenseReportData>;
