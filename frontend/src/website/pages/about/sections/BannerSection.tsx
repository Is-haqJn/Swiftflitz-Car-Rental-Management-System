import { cn } from '@/shared/libs/utils';
import { useAboutSettings } from '@/shared/hooks/queries/useSettings';

const BANNER_IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

export const BannerSection = ({ className }: { className?: string }) => {
    const { data: settingsRes } = useAboutSettings();
    const s = settingsRes?.data;

    const title = s?.hero_title ?? 'ABOUT US';

    const backgroundImage = s?.banner_image_url ?? BANNER_IMAGE_FALLBACK;

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
                                <h2 className="wt-title">{title}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
