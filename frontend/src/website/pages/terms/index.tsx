import { useTitle } from '@/shared/hooks';
import { BannerSection } from './sections/BannerSection';
import { ContentSection } from './sections/ContentSection';

const TermsPage = () => {
    const title = useTitle('Terms & Conditions');
    return (
        <>
            {title}
            <BannerSection />
            <ContentSection />
        </>
    );
};

export default TermsPage;
