import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

const DEFAULT_CARDS = [
    {
        icon_url: 'assets/images/icons/rental.png',
        prefix: '',
        number: 4500,
        suffix: '+',
        label: 'Client Served',
    },
    {
        icon_url: 'assets/images/icons/man.png',
        prefix: '',
        number: 2750,
        suffix: '+',
        label: 'Happy Customers',
    },
    {
        icon_url: 'assets/images/icons/car-insurance.png',
        prefix: '',
        number: 600,
        suffix: '+',
        label: 'Vehicle In Stock Cars',
    },
    {
        icon_url: 'assets/images/icons/work-time.png',
        prefix: '',
        number: 12,
        suffix: '+',
        label: 'Years Experience',
    },
];

export const CounterSection = () => {
    const { data: res } = useHomepageSettings();
    const s = res?.data;

    const show = s?.show_counter_section ?? true;
    if (!show) return null;

    const visibility = s?.counter_visibility ?? 'all';
    const visibilityClass =
        visibility === 'desktop_only'
            ? 'd-none d-md-block'
            : visibility === 'mobile_only'
              ? 'd-md-none'
              : '';

    const title = s?.counter_title ?? 'Find your car by car brand';
    const largeTitle =
        s?.counter_large_title ?? 'Wide Range Of Commercial And Luxury Cars';
    const cards = s?.counter_cards ?? DEFAULT_CARDS;

    return (
        <>
            <div
                className={`section-full p-t150 p-b120 site-bg-white twm-w-range-section-wrap wow fadeInDown${visibilityClass ? ` ${visibilityClass}` : ''}`}
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="container">
                    <div className="section-head center ">
                        <div className="twm-sm-title left">{title}</div>
                        <h2 className="twm-large-title site-text-dark">
                            {largeTitle}
                        </h2>
                    </div>

                    <div className="section-content">
                        <div className="row twm-w-range-section justify-content-center flex-lg-nowrap">
                            {cards.map((card, index) => (
                                <div
                                    key={index}
                                    className="col-lg col-md-6 col-sm-6"
                                >
                                    <div className="twm-cntr-with-icon">
                                        <div className="icon-media">
                                            <img src={card.icon_url} alt="" />
                                        </div>
                                        {card.prefix && (
                                            <em className="symble">
                                                {card.prefix}
                                            </em>
                                        )}
                                        <span className="counter">
                                            {card.number}
                                        </span>{' '}
                                        {card.suffix && (
                                            <em className="symble">
                                                {card.suffix}
                                            </em>
                                        )}
                                        <h3 className="icon-content-info">
                                            {card.label}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
