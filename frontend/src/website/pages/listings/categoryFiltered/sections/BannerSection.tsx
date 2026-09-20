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
}: HeroSectionProps) => {
    return (
        <>
            <div
                className={cn(
                    'wt-bnr-inr twm-inner-banner-s-bar site-bg-dark  twm-primary-overlay-wrap',
                    className
                )}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="twm-primary-overlay"></div>

                <div className="container">
                    <div className="wt-bnr-inr-entry">
                        <div className="banner-title-outer">
                            <div className="banner-title-name">
                                <h2 className="wt-title">Rent A Car</h2>
                            </div>

                            {/*SEARCH SECTION START-->*/}
                            <div className="twm-search-section-wrap">
                                <div className="container">
                                    <div className="twm-search-section-area">
                                        <h3 className="twm-s-section-title">
                                            Available for rent
                                        </h3>
                                        <div className="twm-vehicle-search-section">
                                            <div className="form-group">
                                                <label>
                                                    Choose Vehicle type
                                                </label>
                                                <select
                                                    className="form-select form-control"
                                                    aria-label="Default select example"
                                                >
                                                    <option selected>
                                                        Accra
                                                    </option>
                                                    <option value="1">
                                                        Tokaradi
                                                    </option>
                                                    <option value="2">
                                                        Kumasi
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Pick up Location</label>
                                                <input
                                                    className="form-control"
                                                    placeholder="Type..."
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Drop off Location</label>
                                                <input
                                                    className="form-control"
                                                    placeholder="Type..."
                                                />
                                            </div>

                                            <div className="form-group form-group-2column-wrap twm-input-with-icon">
                                                <label>
                                                    Pick up date and time
                                                </label>
                                                <div className="form-group-2column">
                                                    <div className="input-group date datepicker">
                                                        <input
                                                            className="form-control"
                                                            placeholder="Date"
                                                        />
                                                        <span className="input-group-append input-group-addon">
                                                            <span className="input-group-text">
                                                                <i className="fa fa-solid fa-calendar-days"></i>
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="input-group time timepicker">
                                                        <input
                                                            className="form-control"
                                                            placeholder="Time"
                                                        />
                                                        <span className="input-group-append input-group-addon">
                                                            <span className="input-group-text">
                                                                <i className="fa-regular fa-clock"></i>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group form-group-2column-wrap twm-input-with-icon">
                                                <label>
                                                    Return date and time
                                                </label>
                                                <div className="form-group-2column">
                                                    <div className="input-group date datepicker">
                                                        <input
                                                            className="form-control"
                                                            placeholder="Date"
                                                        />
                                                        <span className="input-group-append input-group-addon">
                                                            <span className="input-group-text">
                                                                <i className="fa fa-solid fa-calendar-days"></i>
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="input-group time timepicker">
                                                        <input
                                                            className="form-control"
                                                            placeholder="Time"
                                                        />
                                                        <span className="input-group-append input-group-addon">
                                                            <span className="input-group-text">
                                                                <i className="fa-regular fa-clock"></i>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="twm-vehicle-search-btn">
                                                <a
                                                    href="cars-grid-4.html"
                                                    className="site-button"
                                                >
                                                    <em>Find A Car</em>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/*SEARCH SECTION END*/}
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Ends here*/}
        </>
    );
};
