import { useEffect, useRef, useState } from 'react';
import {
    publicQuoteService,
    type PublicCategory,
} from '@/services/publicQuoteService';
import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

declare global {
    interface Window {
        jQuery?: any;
    }
}

const CategoryCard = ({ category }: { category: PublicCategory }) => (
    <div className="item">
        <div className="twm-categories-type">
            <div className="twm-media" style={{ position: 'relative' }}>
                <img
                    src={category.image || 'assets/images/vehicle/pic13.jpg'}
                    alt={category.name}
                />
                <div className="twm-media-link">
                    <span className="twm-media-link-content">
                        {category.name}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

export const CategoriesSection = () => {
    const { data: settingsRes } = useHomepageSettings();
    const s = settingsRes?.data;

    const [categories, setCategories] = useState<PublicCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        publicQuoteService
            .getCategories()
            .then(res => setCategories(res.data))
            .finally(() => setLoading(false));
    }, []);

    // Returns how many items OWL shows at the current viewport width.
    const getEffectiveItems = () => {
        const w = window.innerWidth;
        if (w >= 1200) return 4;
        if (w >= 768) return 3;
        return 2;
    };

    // Initialise (or re-initialise) OWL Carousel after React has committed
    // the category cards to the DOM. Re-runs on breakpoint changes so loop
    // threshold stays accurate across screen sizes.
    useEffect(() => {
        if (loading || categories.length === 0) return;
        if (!window.jQuery || !carouselRef.current) return;

        const $ = window.jQuery;

        const init = () => {
            if (!carouselRef.current) return;
            const $el = $(carouselRef.current);
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');

            const count = categories.length;
            const effectiveItems = getEffectiveItems();
            const shouldLoop = count > effectiveItems;

            $el.owlCarousel({
                loop: shouldLoop,
                autoplay: shouldLoop,
                margin: 50,
                autoplayTimeout: 3000,
                nav: shouldLoop,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 2 },
                    768: { items: 3 },
                    1200: { items: 4 },
                },
            });
        };

        init();

        let lastBreakpoint = getEffectiveItems();
        let debounceTimer: ReturnType<typeof setTimeout>;

        const onResize = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const bp = getEffectiveItems();
                if (bp !== lastBreakpoint) {
                    lastBreakpoint = bp;
                    init();
                }
            }, 150);
        };

        window.addEventListener('resize', onResize);
        return () => {
            clearTimeout(debounceTimer);
            window.removeEventListener('resize', onResize);
            if (carouselRef.current) {
                const $el = $(carouselRef.current);
                if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            }
        };
    }, [loading, categories]);

    return (
        <>
            <div
                className="section-full p-t150 site-bg-white twm-categories-section-wrap wow fadeInDown"
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 col-md-12">
                            <div className="section-head left">
                                <div className="twm-sm-title left">
                                    {s?.categories_title}
                                </div>
                                <h2 className="twm-large-title site-text-dark">
                                    {s?.categories_large_title}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="section-content">
                        {loading ? (
                            // Plain .row - NOT .owl-carousel - so useCustomScripts
                            // never initialises OWL on these skeleton nodes.
                            <div className="row m-b30">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="col-lg-3 col-md-4 col-6 m-b30"
                                    >
                                        <div
                                            className="twm-categories-type"
                                            style={{
                                                minHeight: 160,
                                                background: '#f5f5f5',
                                                borderRadius: 8,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center p-t50 p-b50">
                                <p>No categories available at the moment.</p>
                            </div>
                        ) : (
                            // ref-controlled carousel - OWL is initialised by our
                            // useEffect only after the category cards are in the DOM.
                            <div
                                ref={carouselRef}
                                className="owl-carousel twm-categories-carousel next-prev-top-right"
                            >
                                {categories.map(category => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
