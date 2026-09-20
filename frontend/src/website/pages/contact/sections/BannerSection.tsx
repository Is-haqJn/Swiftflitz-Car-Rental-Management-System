import { useContactSettings } from '@/shared/hooks/queries/useSettings';

const BANNER_IMAGE_FALLBACK = '/assets/images/contact-banner.jpg';

export const BannerSection = () => {
    const { data: res } = useContactSettings();
    const s = res?.data ?? {};

    const title = s.banner_title ?? 'Contact Us';
    const backgroundImage = s.banner_image_url ?? BANNER_IMAGE_FALLBACK;

    return (
        <div
            className="wt-bnr-inr site-bg-dark twm-primary-overlay-wrap"
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
