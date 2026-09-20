export type ExportStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type ExportType =
    | 'rentals'
    | 'customers'
    | 'vehicles'
    | 'activity_logs'
    | 'report-revenue'
    | 'report-vehicles'
    | 'report-manager-performance'
    | 'report-outstanding-payments'
    | 'report-maintenance'
    | 'report-customer-analysis';

export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportRecord {
    id: string;
    type: ExportType;
    format: ExportFormat;
    status: ExportStatus;
    filename: string | null;
    file_size: number | null;
    error_message: string | null;
    filters: Record<string, unknown> | null;
    expires_at: string | null;
    created_at: string;
}

export interface QueueExportPayload {
    type: ExportType;
    format?: ExportFormat;
    filters?: Record<string, unknown>;
}
