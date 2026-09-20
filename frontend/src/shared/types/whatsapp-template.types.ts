export interface WhatsAppTemplate {
    key: string;
    name: string;
    description: string | null;
    template_name: string;
    default_template_name: string;
    header: string | null;
    default_header: string | null;
    body: string;
    default_body: string;
    footer: string | null;
    default_footer: string | null;
    variables: string[];
    default_variables: string[];
    language_code: string;
    is_customised: boolean;
    updated_at: string | null;
}

export interface UpdateWhatsAppTemplatePayload {
    template_name: string;
    language_code: string;
    header?: string | null;
    body: string;
    footer?: string | null;
    variables: string[];
}
