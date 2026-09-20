import { Link } from 'react-router-dom';

import { useAboutSettings } from '@/shared/hooks/queries/useSettings';

const BG_IMAGE_FALLBACK = '/assets/images/abus-pic.jpg';
const OVERLAY_IMAGE_FALLBACK = '/assets/images/car-pic1.png';

export const GeneralAboutUsSection = ({
    showReadMore = false,
}: {
    showReadMore?: boolean;
}) => {
    const { data: settingsRes } = useAboutSettings();
    const s = settingsRes?.data;

    const bgSrc = s?.general_bg_image_url ?? BG_IMAGE_FALLBACK;
    const overlaySrc = s?.general_overlay_image_url ?? OVERLAY_IMAGE_FALLBACK;

    const listItems =
        s?.general_list_items && s.general_list_items.length > 0
            ? s.general_list_items
            : [
                  'All Type Vehicle Available',
                  'You Get 24/7 Roadside Assistance',
                  'We Are The Largest Provider',
              ];

    return (
        <>
            <div
                className="section-full site-bg-white p-t30 p-b120 twm-abus-section-wrap wow fadeInDown"
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="container">
                    <div className="row twm-abus-section">
                        <div className="col-lg-7 col-md-12 order-2 order-lg-1">
                            <div className="twm-abus-left">
                                <div className="twm-media">
                                    <img
                                        src={bgSrc}
                                        alt="About Us"
                                        style={{
                                            maxHeight: 300,
                                            objectFit: 'cover',
                                            marginTop: 50,
                                        }}
                                    />
                                </div>
                                <div className="twm-media2">
                                    <img src={overlaySrc} alt="About Us" />
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 col-md-12 order-1 order-lg-2">
                            <div className="section-head left aside-section">
                                <div className="twm-sm-title left">
                                    {s?.general_title ?? 'About Us'}
                                </div>
                                <h2 className="twm-large-title site-text-dark">
                                    {s?.general_large_title ??
                                        'We Have Many Provided Assistance To People And Companies In This Field'}
                                </h2>
                                <div className="section-head-detail">
                                    {s?.general_description ??
                                        'We are dedicated to providing the best car rental experience with a wide selection of vehicles to suit every need and budget.'}
                                </div>
                            </div>
                            <div className="twm-inline-list2">
                                <ul>
                                    {listItems.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            {showReadMore && (
                                <div className="twm-btn-left">
                                    <Link to="/about" className="site-button">
                                        <em>Read More</em>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
