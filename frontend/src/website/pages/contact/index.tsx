import { useTitle } from '@/shared/hooks';
import {
    BannerSection,
    ContactInfoSection,
    ContactMapSection,
    ContactUsSection,
} from './sections';

const ContactUs = () => {
    const title = useTitle('Contact Us');
    return (
        <>
            {title}
            <BannerSection />
            <ContactUsSection />
            <ContactMapSection />
            <ContactInfoSection />
        </>
    );
};

export default ContactUs;
