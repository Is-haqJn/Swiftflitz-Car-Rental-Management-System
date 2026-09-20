import { useAboutSettings } from '@/shared/hooks/queries/useSettings';

const VALUES_BG_IMAGE_FALLBACK = '/assets/images/ab-us.jpg';

export const OurValues = () => {
    const { data: settingsRes } = useAboutSettings();
    const s = settingsRes?.data;

    if (s?.values_enabled === false) {
        return null;
    }

    const title = s?.values_title ?? 'Our Values';
    const largeTitle = s?.values_large_title ?? 'What we stand for';
    const cards = s?.values_cards ?? [];
    const bgImage = s?.values_bg_image_url ?? VALUES_BG_IMAGE_FALLBACK;

    return (
        <>
            <div
                className="section-full site-bg-light twm-abus-section-wrap wow fadeInDown"
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="row">
                    <div className="col-lg-6 col-md-12">
                        <div className="twm-abus-st2-section">
                            {/* <!-- TITLE START--> */}
                            <div className="section-head left">
                                <div className="twm-sm-title left">{title}</div>
                                <h2 className="twm-large-title site-text-dark">
                                    {largeTitle}
                                </h2>
                            </div>
                            {/* <!-- TITLE END--> */}
                            <div className="row">
                                {cards.map((card, index) => (
                                    <div
                                        key={index}
                                        className="col-lg-6 col-md-6 col-sm-6 m-b30"
                                    >
                                        <div className="twm-w-steps-st2">
                                            <div className="twm-w-step-detail">
                                                {card.icon_url ? (
                                                    <div className="d-flex flex-column flex-sm-row align-items-start gap-3">
                                                        <div
                                                            style={{
                                                                minWidth: 60,
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    'var(--color-primary)',
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <img
                                                                src={
                                                                    card.icon_url
                                                                }
                                                                alt={card.title}
                                                                style={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    objectFit:
                                                                        'contain',
                                                                    filter: 'brightness(0) saturate(100%) invert(100%)',
                                                                }}
                                                            />
                                                        </div>
                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                                overflowWrap:
                                                                    'anywhere',
                                                            }}
                                                        >
                                                            <h3 className="twm-title">
                                                                {card.title}
                                                            </h3>
                                                            <p>
                                                                {
                                                                    card.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="twm-title">
                                                            {card.title}
                                                        </h3>
                                                        <p>
                                                            {card.description}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div
                        className="col-lg-6 col-md-12 twm-abus2-right-pic"
                        style={{
                            backgroundImage: `url(${bgImage})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                    ></div>
                </div>
            </div>
        </>
    );
};
