export const Formsample = () => {
    return (
        <>
            <div className="section-full p-t150 p-b120 site-bg-white twm-contact-section-wrap">
                <div className="container">
                    <div className="section-content">
                        <div className="twm-contact-section">
                            <div className="row">
                                <div className="col-xl-5 col-lg-6 col-md-12">
                                    <div className="twm-contact-page-detail">
                                        {/*TITLE START*/}
                                        <div className="section-head left ">
                                            <h2 className="twm-large-title">
                                                Book Now
                                            </h2>
                                            <p className="p-text">
                                                Enter your details. And you can
                                                feel free to contact us for any
                                                kind of information.
                                            </p>
                                        </div>
                                        {/*<!-- TITLE END*/}

                                        <div className="twm-contact-page-form">
                                            <div className="contact-form-outer">
                                                <form
                                                    className="cons-contact-form"
                                                    method="post"
                                                    action="phpmailer/mail.php"
                                                >
                                                    <div className="row">
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-4">
                                                                <input
                                                                    name="username"
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="First Name"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-4">
                                                                <input
                                                                    name="username"
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Last Name"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="col-lg-12 col-md-12">
                                                            <div className="form-group mb-4">
                                                                <input
                                                                    name="email"
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Email"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="col-lg-12 col-md-12">
                                                            <div className="form-group mb-4">
                                                                <input
                                                                    name="phone"
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Phone"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="col-lg-12">
                                                            <div className="form-group mb-5">
                                                                <textarea
                                                                    name="message"
                                                                    className="form-control"
                                                                    placeholder="Message"
                                                                ></textarea>
                                                            </div>
                                                        </div>

                                                        <div className="col-md-12">
                                                            <button
                                                                type="submit"
                                                                className="site-button dark-bg"
                                                            >
                                                                <em>
                                                                    Submit Now
                                                                </em>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
