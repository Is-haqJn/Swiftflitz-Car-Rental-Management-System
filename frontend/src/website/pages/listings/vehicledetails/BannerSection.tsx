import { cn } from '@/shared/libs/utils';

interface BannerSectionProps {
    title?: string;
    backgroundImage?: string;
    className?: string;
}

export const BannerSection = ({
    title = 'Vehicle Details',
    backgroundImage = '/assets/images/main-slider/slide2/bg-pic1.jpg',
    className,
}: BannerSectionProps) => {
    return (
        <div
            className={cn(
                'wt-bnr-inr twm-inner-banner-s-bar site-bg-dark twm-primary-overlay-wrap',
                className
            )}
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="twm-primary-overlay" />
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
