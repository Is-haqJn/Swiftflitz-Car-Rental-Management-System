export interface PopupSettingsData {
    promo_enabled?: boolean;
    promo_title?: string;
    promo_description?: string;
    promo_code?: string | null;
    promo_button_label?: string;
    promo_button_url?: string;
    promo_image_url?: string | null;
    promo_frequency?: 'always' | 'once_per_day';
    promo_delay_seconds?: number;

    announcement_enabled?: boolean;
    announcement_title?: string;
    announcement_body?: string;
    announcement_frequency?: 'always' | 'once_per_day';
    announcement_delay_seconds?: number;
}

export interface HeaderSettingsData {
    logo_url?: string | null;
    tagline?: string | null;
    phone?: string;
    email?: string;
    cta_text?: string;
    cta_url?: string;
}

export interface HomepageSettingsData {
    hero_title_beginning?: string;
    hero_title_words?: string[];
    hero_title_highlight?: string;
    hero_title_ending?: string;
    hero_side_text?: string | null;
    hero_subtitle?: string;
    hero_description?: string | null;
    hero_image_version?: number;
    hero_image_url?: string | null;
    hero_background_text?: string | null;
    hero_cta_text?: string;
    hero_cta_url?: string;
    hero_secondary_cta_text?: string | null;
    hero_secondary_cta_url?: string | null;
    hero_featured_vehicle_enabled?: boolean;
    hero_featured_vehicle_visibility?: 'all' | 'desktop_only' | 'mobile_only';
    hero_featured_vehicle_mode?: 'custom' | 'random' | 'specific';
    hero_featured_vehicle_id?: string | null;
    hero_featured_vehicle_custom_title?: string | null;
    hero_featured_vehicle_custom_price?: string | null;
    hero_featured_vehicle_url?: string;
    hero_featured_vehicle_resolved_name?: string | null;
    hero_featured_vehicle_resolved_price?: string | null;
    stats_cars?: number;
    stats_customers?: number;
    stats_years?: number;
    features_title?: string;
    features_subtitle?: string;
    features_description?: string | null;
    categories_title?: string;
    categories_large_title?: string;
    featured_title?: string;
    featured_large_title?: string;
    featured_empty_text?: string | null;
    show_about_section?: boolean;
    why_title?: string;
    why_large_title?: string;
    why_bg_image_version?: number;
    whychooseus_bg_image_url?: string | null;
    why_cards?: Array<{
        image_url: string;
        title: string;
        description: string;
    }>;
    show_why_choose_us_section?: boolean;
    why_choose_us_visibility?: 'all' | 'desktop_only' | 'mobile_only';
    chauffeur_title?: string;

    chauffeur_large_title?: string;
    chauffeur_image_version?: number;
    chauffeur_image_url?: string | null;
    chauffeur_cta_text?: string;
    chauffeur_cta_url?: string;
    show_chauffeur_section?: boolean;
    chauffeur_visibility?: 'all' | 'desktop_only' | 'mobile_only';
    show_pickup_process_section?: boolean;
    pickup_process_visibility?: 'all' | 'desktop_only' | 'mobile_only';
    pickup_process_title?: string;
    pickup_process_large_title?: string;
    pickup_process_bg_image_version?: number;
    pickup_process_bg_image_url?: string | null;
    pickup_process_bottom_image_version?: number;
    pickup_process_bottom_image_url?: string | null;
    pickup_process_steps?: Array<{
        number: string;
        title: string;
        description: string;
    }>;
    show_counter_section?: boolean;
    counter_visibility?: 'all' | 'desktop_only' | 'mobile_only';
    counter_title?: string;
    counter_large_title?: string;
    counter_cards?: Array<{
        icon_url: string;
        prefix: string;
        number: number;
        suffix: string;
        label: string;
    }>;
    show_testimonial_section?: boolean;
    testimonial_visibility?: 'all' | 'desktop_only' | 'mobile_only';
    testimonial_title?: string;
    testimonial_large_title?: string;
    testimonial_show_images?: boolean;
    testimonial_show_ratings?: boolean;
    testimonial_cards?: Array<{
        image_url: string | null;
        name: string;
        position: string | null;
        details: string;
        rating: number | null;
    }>;
}

export interface AboutSettingsData {
    hero_title?: string;
    hero_subtitle?: string;
    hero_image_url?: string | null;
    banner_image_version?: number;
    banner_image_url?: string | null;
    story_title?: string;
    story_content?: string;
    mission?: string;
    vision?: string;
    values?: string | null;
    general_title?: string;
    general_large_title?: string;
    general_description?: string;
    general_list_items?: string[];
    general_bg_image_version?: number;
    general_bg_image_url?: string | null;
    general_overlay_image_version?: number;
    general_overlay_image_url?: string | null;
    values_enabled?: boolean;
    values_title?: string;
    values_large_title?: string;
    values_bg_image_version?: number;
    values_bg_image_url?: string | null;
    values_cards?: Array<{
        icon_url: string;
        title: string;
        description: string;
    }>;
    team_enabled?: boolean;
    team_title?: string;
    team_large_title?: string;
    team_members?: Array<{
        name: string;
        position: string;
        image_url: string;
        socials: Array<{ icon: string; url: string }>;
    }>;
}

export interface ServiceFacilityCard {
    image_url?: string;
    title?: string;
    description?: string;
    button_text?: string;
    button_url?: string;
}

export interface WhyChooseUsCard {
    number?: string;
    title?: string;
    description?: string;
}

export interface ServicesSettingsData {
    banner_title?: string;
    banner_image_version?: number;
    banner_image_url?: string | null;
    facilities_title?: string;
    facilities_large_title?: string;
    facilities_cards?: ServiceFacilityCard[];
    why_choose_us_enabled?: boolean;
    why_choose_us_bg_image_version?: number;
    why_choose_us_bg_image_url?: string | null;
    why_choose_us_title?: string;
    why_choose_us_large_title?: string;
    why_choose_us_cards?: WhyChooseUsCard[];
    listings_banner_image_url?: string | null;
    airport_transfer_banner_image_url?: string | null;
    chauffeur_banner_image_url?: string | null;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqSettingsData {
    banner_title?: string;
    banner_image_version?: number;
    banner_image_url?: string | null;
    faq_section_enabled?: boolean;
    faq_section_bg_image_version?: number;
    faq_section_bg_image_url?: string | null;
    faq_section_large_title?: string;
    faq_items?: FaqItem[];
}

export interface ContactSocialItem {
    icon: string;
    url: string;
}

export interface PublicBranchCard {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
}

export interface ContactSettingsData {
    banner_title?: string;
    banner_image_version?: number;
    banner_image_url?: string | null;
    contact_section_large_title?: string;
    contact_section_bg_image_version?: number;
    contact_section_bg_image_url?: string | null;
    contact_socials_enabled?: boolean;
    contact_socials_title?: string;
    contact_socials?: ContactSocialItem[];
    address?: string;
    phone?: string;
    email?: string;
    hours?: string | null;
    map_enabled?: boolean;
    map_embed_url?: string | null;
    contact_branch_locations_enabled?: boolean;
    contact_branch_locations_title?: string;
    contact_branch_ids?: string[];
    whatsapp_number?: string | null;
}

export interface FooterOpeningHourItem {
    days: string;
    time: string;
}

export interface FooterQuickLinkItem {
    name: string;
    url: string;
}

export interface TermsSettingsData {
    banner_title?: string;
    banner_image_version?: number;
    content?: string;
    chauffeur_overtime_rate?: number;
}

export interface PrivacySettingsData {
    banner_title?: string;
    banner_image_version?: number;
    content?: string;
}

export interface FooterSettingsData {
    tagline?: string;
    copyright?: string;
    footer_socials_enabled?: boolean;
    opening_hours_title?: string;
    opening_hours?: FooterOpeningHourItem[];
    quick_links_title?: string;
    quick_links?: FooterQuickLinkItem[];
    footer_legal_enabled?: boolean;
    footer_legal_title?: string;
}
