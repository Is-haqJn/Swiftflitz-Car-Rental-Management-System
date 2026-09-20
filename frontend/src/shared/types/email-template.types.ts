export interface EmailTemplate {
    key: string;
    name: string;
    description: string | null;
    subject: string;
    default_subject: string;
    html_content: string | null;
    default_html: string | null;
    is_customised: boolean;
    updated_at: string | null;
}

export interface UpdateEmailTemplatePayload {
    subject: string;
    html_content: string;
}
