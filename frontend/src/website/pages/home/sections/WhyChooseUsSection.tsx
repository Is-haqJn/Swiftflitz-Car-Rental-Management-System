import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

const DEFAULT_CARDS = [
    {
        image_url: 'assets/images/icons/label.png',
        title: 'Deals For Every Budget',
        description:
            'Incredible prices on every car, van, bike and package worldwide Book vehicles at incredible prices worldwide',
    },
    {
        image_url: 'assets/images/icons/customer-support.png',
        title: '24/7 Road Assistance',
        description:
            'We are ready to assist you and provide reliable support. Who Will keep you moving forward with confidence and mental peace.',
    },
    {
        image_url: 'assets/images/icons/parking-area.png',
        title: 'Free Pick-Up & Drop-Off',
        description:
            'Enjoy free pickup and drop-off services, which adds an extra layer of ease to your car rental experience.',
    },
];

export const WhyChooseUsSection = () => {
    const { data: settingsRes } = useHomepageSettings();
    const s = settingsRes?.data;

    const show = s?.show_why_choose_us_section ?? true;
    if (!show) return null;

    const visibility = s?.why_choose_us_visibility ?? 'all';
    const visibilityClass =
        visibility === 'desktop_only'
            ? 'd-none d-md-block'
            : visibility === 'mobile_only'
              ? 'd-md-none'
              : '';

    const cards = s?.why_cards?.length ? s.why_cards : DEFAULT_CARDS;
    const bgVersion = s?.why_bg_image_version ?? 1;
    const bgImageUrl = s?.whychooseus_bg_image_url
        ? `${s.whychooseus_bg_image_url}?v=${bgVersion}`
        : undefined;

    return (
        <div
            className={`section-full p-t150 p-b120 site-bg-dark twm-step-towards-section-wrap wow fadeInDown${visibilityClass ? ` ${visibilityClass}` : ''}`}
            data-wow-offset="100"
            data-wow-delay="0.2"
        >
            <div
                className="twm-half-bg-pic"
                style={{
                    backgroundImage: bgImageUrl
                        ? `url(${bgImageUrl})`
                        : undefined,
                }}
            ></div>
            <div className="container">
                <div className="row">
                    <div className="col-lg-6 col-md-12">
                        {/* <!-- TITLE START--> */}
                        <div className="section-head left">
                            <div className="twm-sm-title left">
                                {s?.why_title ?? 'One step towards you'}
                            </div>
                            <h2 className="twm-large-title site-text-white">
                                {s?.why_large_title ??
                                    "Let's Your Adventure Begin"}
                            </h2>
                        </div>
                        {/* <!-- TITLE END--> */}
                    </div>
                </div>

                <div className="section-content">
                    <div className="row twm-step-towards-section justify-content-center flex-lg-nowrap">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="col-xl-4 col-lg-4 col-md-4 m-b30"
                            >
                                <div className="twm-icon-style-left large-set in-dark-area">
                                    <div className="twm-media">
                                        <img
                                            src={card.image_url}
                                            alt={card.title}
                                        />
                                    </div>
                                    <div className="twm-content">
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
    );
};
