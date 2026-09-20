import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

export const ChauffeurSection = () => {
    const { data: res } = useHomepageSettings();
    const s = res?.data;

    const show = s?.show_chauffeur_section ?? true;
    if (!show) return null;

    const visibility = s?.chauffeur_visibility ?? 'all';
    const visibilityClass =
        visibility === 'desktop_only'
            ? 'd-none d-md-block'
            : visibility === 'mobile_only'
              ? 'd-md-none'
              : '';

    const title = s?.chauffeur_title ?? 'Car Brands';
    const largeTitle = s?.chauffeur_large_title ?? 'Explore Our Premium Brands';
    const imageVersion = s?.chauffeur_image_version ?? 1;
    const chauffeurImageUrl = s?.chauffeur_image_url
        ? `${s.chauffeur_image_url}?v=${imageVersion}`
        : 'assets/images/explore-sec-image.png';
    const ctaText = s?.chauffeur_cta_text ?? 'View All Brands';
    const ctaUrl = s?.chauffeur_cta_url ?? '/fleet';

    return (
        <>
            <div
                className={`section-full twm-explore-section-wrap site-bg-primary${visibilityClass ? ` ${visibilityClass}` : ''}`}
            >
                <div className="container">
                    <div className="row">
                        <div className="col-xl-4 col-lg-12">
                            {/* <!-- TITLE START--> */}
                            <div className="section-head left">
                                <div className="twm-sm-title left site-text-white">
                                    {title}
                                </div>
                                <h2 className="twm-large-title site-text-white">
                                    {largeTitle}
                                </h2>
                            </div>
                            {/* <!-- TITLE END--> */}
                        </div>
                        <div className="col-xl-6 col-lg-12">
                            <div className="twm-mid-section-car">
                                <div className="twm-media">
                                    <img src={chauffeurImageUrl} alt="Image" />
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-2 col-lg-12">
                            <div className="twm-mid-section-btn">
                                <a href={ctaUrl} className="site-button">
                                    <em>{ctaText}</em>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
