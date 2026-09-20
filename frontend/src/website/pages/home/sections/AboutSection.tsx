import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';
import { GeneralAboutUsSection } from '@/website/pages/about/sections/GeneralAboutUsSection';

export const AboutSection = () => {
    const { data: settingsRes } = useHomepageSettings();
    const show = settingsRes?.data?.show_about_section ?? true;

    if (!show) return null;

    return <GeneralAboutUsSection showReadMore />;
};
