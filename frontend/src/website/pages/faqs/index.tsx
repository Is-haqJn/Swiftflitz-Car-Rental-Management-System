import { useTitle } from '@/shared/hooks';
import { BannerSection, FaqOneSection } from './sections';

const Faqs = () => {
    const title = useTitle('FAQs');
    return (
        <>
            {title}
            <BannerSection />
            <FaqOneSection />
        </>
    );
};

export default Faqs;
