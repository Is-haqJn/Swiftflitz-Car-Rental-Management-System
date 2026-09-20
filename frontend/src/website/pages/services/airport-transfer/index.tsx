// import { ROUTES } from '@/shared/routes';
import {
    Formsample,
    BannerSection,
    PackageSection,
    SearchSection,
} from './sections';
import { useTitle } from '@/shared/hooks';

const AirportTransfer = () => {
    const title = useTitle('Airport - Transfer');
    return (
        <>
            {title}
            <BannerSection />
            <SearchSection />
            <PackageSection />
            <Formsample />
        </>
    );
};

export default AirportTransfer;
