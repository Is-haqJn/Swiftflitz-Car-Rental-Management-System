import { useTitle } from '@/shared/hooks';
import { BannerSection, ErrorSection } from './sections';

export const Error404Page = () => {
    const title = useTitle('404 - Page Not Found');
    return (
        <>
            {title}
            <BannerSection
                backgroundImage="assets/images/banner/banner-6.jpg"
                title="Page Not Found"
            />
            <ErrorSection />
        </>
    );
};
