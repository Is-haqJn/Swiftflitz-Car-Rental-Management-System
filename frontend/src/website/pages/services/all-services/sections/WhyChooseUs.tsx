import { useServicesSettings } from '@/shared/hooks/queries/useSettings';
import type { WhyChooseUsCard } from '@/shared/types';

const BG_IMAGE = '/assets/images/services-why-choose-us-bg.jpg';
const FALLBACK_IMAGE = '/assets/images/h-it-work.jpg';

const DEFAULT_CARDS: WhyChooseUsCard[] = [
    {
        number: '01',
        title: 'Wide Fleet Selection',
        description:
            'From economy cars to luxury SUVs for every budget and occasion.',
    },
    {
        number: '02',
        title: 'Transparent Pricing',
        description:
            'No hidden fees - what you see is what you pay, every time.',
    },
    {
        number: '03',
        title: '24/7 Support',
        description:
            'Our team is always available whenever you need us, day or night.',
    },
    {
        number: '04',
        title: 'Fast & Easy Booking',
        description:
            'Reserve your vehicle online in under 3 minutes with instant confirmation.',
    },
];

export const WhyChooseUs = () => {
    const { data: res } = useServicesSettings();
    const s = res?.data ?? {};

    if (s.why_choose_us_enabled === false) {
        return null;
    }

    const title = s.why_choose_us_title ?? 'WHY SWIFTFLITZ';
    const largeTitle =
        s.why_choose_us_large_title ?? 'The Swiftflitz Difference';
    const cards: WhyChooseUsCard[] = s.why_choose_us_cards ?? DEFAULT_CARDS;
    const bgImage = s.why_choose_us_bg_image_url ?? BG_IMAGE;

    return (
        <div
            className="section-full site-bg-light twm-how-it-work-wrap wow fadeInDown"
            data-wow-offset="100"
            data-wow-delay="0.2"
        >
            <div className="section-content">
                <div className="twm-how-it-work-section container-fluid">
                    <div className="row">
                        <div className="col-lg-6 col-md-12">
                            <div className="twm-how-it-work-media">
                                <img
                                    src={bgImage}
                                    alt="Why Choose Us"
                                    onError={e => {
                                        (
                                            e.currentTarget as HTMLImageElement
                                        ).src = FALLBACK_IMAGE;
                                    }}
                                />
                            </div>
                        </div>

                        <div className="col-lg-6 col-md-12">
                            <div className="twm-how-it-work-content">
                                <div className="section-head left">
                                    <div className="twm-sm-title left">
                                        {title}
                                    </div>
                                    <h2 className="twm-large-title site-text-dark">
                                        {largeTitle}
                                    </h2>
                                </div>

                                <div className="row">
                                    {cards.map((card, index) => (
                                        <div
                                            key={index}
                                            className="col-lg-6 col-md-6 col-sm-6 m-b30"
                                        >
                                            <div className="twm-w-steps-st2">
                                                <div className="twm-w-step-count">
                                                    <span>
                                                        {card.number ??
                                                            String(
                                                                index + 1
                                                            ).padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <div className="twm-w-step-detail">
                                                    <h3 className="twm-title">
                                                        {card.title}
                                                    </h3>
                                                    <p>{card.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
