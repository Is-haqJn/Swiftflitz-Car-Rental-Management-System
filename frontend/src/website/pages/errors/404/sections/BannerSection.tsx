import { cn } from '@/shared/libs/utils';

interface HeroSectionProps {
    title?: string;
    subTitle?: string;
    description?: string;
    backgroundImage?: string;
    primaryCtaText?: string;
    primaryCtaUrl?: string;
    secondaryCtaText?: string;
    secondaryCtaUrl?: string;
    tagTopText?: string;
    tagText?: string;
    tagSubText?: string;
    className?: string;
}

export const BannerSection = ({
    backgroundImage = '/assets/images/main-slider/slide2/bg-pic1.jpg',
    className,
    title = '404 - Page Not Found',
}: HeroSectionProps) => {
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
