import { cn } from '@/shared/libs/utils';
import { useServicesSettings } from '@/shared/hooks/queries/useSettings';

const BANNER_IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

export const BannerSection = ({ className }: { className?: string }) => {
    const { data: res } = useServicesSettings();
    const backgroundImage =
        res?.data?.airport_transfer_banner_image_url ?? BANNER_IMAGE_FALLBACK;
    return (
        <>
            <div
                className={cn(
                    'wt-bnr-inr site-bg-dark  twm-primary-overlay-wrap',
                    className
                )}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="twm-primary-overlay"></div>
                <div className="container">
                    <div className="wt-bnr-inr-entry">
                        <div className="banner-title-outer">
                            <div className="banner-title-name">
                                <h2 className="wt-title">AIRPORT TRANSFER</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
