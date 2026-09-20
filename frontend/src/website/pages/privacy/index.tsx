import { useTitle } from '@/shared/hooks';
import { BannerSection } from './sections/BannerSection';
import { ContentSection } from './sections/ContentSection';

const PrivacyPage = () => {
    const title = useTitle('Privacy Policy');
    return (
        <>
            {title}
            <BannerSection />
            <ContentSection />
        </>
    );
};

export default PrivacyPage;
