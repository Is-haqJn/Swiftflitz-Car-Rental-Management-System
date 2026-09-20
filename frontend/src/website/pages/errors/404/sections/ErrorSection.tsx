import { Link } from 'react-router-dom';

export const ErrorSection = ({
    backgroundImage = 'assets/images/404-error.png',
    errorTitle = 'Whoops!',
    errorCode = '404',
    errorMessage = "It Looks Like You're Lost.",
    errorDescription = "The page you're looking for isn't available. Try to search again or use the go to.",
    errorButtonText = 'Go Back',
    errorButtonLink = '/',
}: {
    backgroundImage?: string;
    errorTitle?: string;
    errorCode?: string;
    errorMessage?: string;
    errorDescription?: string;
    errorButtonText?: string;
    errorButtonLink?: string;
}) => {
    return (
        <div className="section-full p-t150 p-b120 site-bg-white twm-error-section-wrap">
            <div className="container">
                <div className="section-content">
                    <div className="row twm-error-section">
                        {/* <!--One block--> */}
                        <div
                            className="col-lg-7 col-md-6 m-b30 wow fadeInDown"
                            data-wow-delay="0.2"
                        >
                            <div className="twm-error-media">
                                <img src={backgroundImage} alt="#" />
                            </div>
                        </div>

                        {/* <!--Two block--> */}
                        <div
                            className="col-lg-5 col-md-6 m-b30 wow fadeInDown"
                            data-wow-delay="0.2"
                        >
                            <div className="twm-error-content">
                                <span className="sm-title">{errorTitle}</span>
                                <h2 className="large-text">{errorCode}</h2>
                                <h3 className="md-text">{errorMessage}</h3>
                                <div className="error-discription">
                                    {errorDescription}
                                </div>
                                <div className="twm-btn-left">
                                    <Link
                                        to={
                                            document.referrer || errorButtonLink
                                        }
                                        className="site-button"
                                    >
                                        <em>{errorButtonText}</em>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
