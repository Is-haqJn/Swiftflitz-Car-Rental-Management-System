import { useFaqSettings } from '@/shared/hooks/queries/useSettings';

const SECTION_BG_IMAGE_FALLBACK = '/assets/images/faq-section-bg.jpg';

export const FaqOneSection = () => {
    const { data: res, isError } = useFaqSettings();
    const s = res?.data ?? {};

    const enabled = s.faq_section_enabled ?? true;
    const largeTitle =
        s.faq_section_large_title ?? 'Frequently Asked Questions';
    const bgImage = s.faq_section_bg_image_url ?? SECTION_BG_IMAGE_FALLBACK;
    const items = s.faq_items ?? [];

    if (!enabled) {
        return null;
    }

    return (
        <div className="section-full p-t150 p-b120 site-bg-white twm-faq-section-wrap">
            <div className="container">
                <div className="row twm-faq-section-1 m-b30">
                    <div
                        className="col-lg-4 col-md-12 m-b30 wow fadeInDown order-2 order-lg-1"
                        data-wow-delay="0.2"
                    >
                        <div className="video-section-outer">
                            <div className="video-section">
                                <img
                                    src={bgImage}
                                    alt="FAQ section background"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className="col-lg-8 col-md-12 wow fadeInDown order-1 order-lg-2"
                        data-wow-delay="0.2"
                    >
                        <div className="twm-faq-info-wrap">
                            <div className="section-head left">
                                <h2 className="twm-large-title site-text-dark">
                                    {largeTitle}
                                </h2>
                            </div>

                            <div className="twm-faq-info">
                                {isError || items.length === 0 ? (
                                    <p className="text-muted">
                                        No FAQs available at the moment.
                                    </p>
                                ) : (
                                    <div
                                        className="accordion twm-acdn"
                                        id="sf-faq-accordion"
                                    >
                                        {items.map((item, index) => {
                                            const id = `FAQ-${index}`;
                                            return (
                                                <div
                                                    key={id}
                                                    className="accordion-item"
                                                >
                                                    <button
                                                        className={`accordion-button${index !== 0 ? ' collapsed' : ''}`}
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#${id}`}
                                                        aria-expanded={
                                                            index === 0
                                                                ? 'true'
                                                                : 'false'
                                                        }
                                                    >
                                                        {item.question}
                                                    </button>
                                                    <div
                                                        id={id}
                                                        className={`accordion-collapse collapse${index === 0 ? ' show' : ''}`}
                                                        data-bs-parent="#sf-faq-accordion"
                                                    >
                                                        <div className="accordion-body">
                                                            {item.answer}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
