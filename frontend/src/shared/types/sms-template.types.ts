export interface SmsTemplate {
    key: string;
    name: string;
    description: string | null;
    body: string;
    default_body: string;
    is_customised: boolean;
    updated_at: string | null;
}

export interface UpdateSmsTemplatePayload {
    body: string;
}
