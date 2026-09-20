import { cn } from '@/shared/libs/utils';
import { usePrivacySettings } from '@/shared/hooks/queries/useSettings';

const BANNER_IMAGE = '/assets/images/privacy-banner.jpg';

export const BannerSection = ({ className }: { className?: string }) => {
    const { data: res } = usePrivacySettings();
    const s = res?.data ?? {};

    const title = s.banner_title ?? 'Privacy Policy';
    const backgroundImage = `${BANNER_IMAGE}?v=${s.banner_image_version ?? 1}`;

    return (
        <div
            className={cn(
                'wt-bnr-inr site-bg-dark twm-primary-overlay-wrap',
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
    );
};
