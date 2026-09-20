import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

const DEFAULT_STEPS = [
    {
        number: '01',
        title: 'Choose A Car',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
    {
        number: '02',
        title: 'Pick Up Date',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
    {
        number: '03',
        title: 'Confirm Your Booking',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
    {
        number: '04',
        title: 'Enjoy Driving',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
];

export const PickupProcessSection = () => {
    const { data: res } = useHomepageSettings();
    const s = res?.data;

    const show = s?.show_pickup_process_section ?? true;
    if (!show) return null;

    const visibility = s?.pickup_process_visibility ?? 'all';
    const visibilityClass =
        visibility === 'desktop_only'
            ? 'd-none d-md-block'
            : visibility === 'mobile_only'
              ? 'd-md-none'
              : '';

    const title = s?.pickup_process_title ?? 'How it Work';
    const largeTitle =
        s?.pickup_process_large_title ?? 'Following Working Steps';
    const bgImageVersion = s?.pickup_process_bg_image_version ?? 1;
    const bottomImageVersion = s?.pickup_process_bottom_image_version ?? 1;
    const steps = s?.pickup_process_steps ?? DEFAULT_STEPS;

    const bgImageUrl = s?.pickup_process_bg_image_url
        ? `${s.pickup_process_bg_image_url}?v=${bgImageVersion}`
        : `assets/images/step-bg.jpg?v=${bgImageVersion}`;

    const bottomImageUrl = s?.pickup_process_bottom_image_url
        ? `${s.pickup_process_bottom_image_url}?v=${bottomImageVersion}`
        : `assets/images/adv-car.png?v=${bottomImageVersion}`;

    return (
        <>
            <div
                className={`section-full p-t150 site-bg-white twm-w-steps-section-wrap wow fadeInDown${visibilityClass ? ` ${visibilityClass}` : ''}`}
                data-wow-offset="100"
                data-wow-delay="0.2"
                style={{
                    backgroundImage: `url(${bgImageUrl})`,
                }}
            >
                <div className="container">
                    <div className="section-head center ">
                        <div className="twm-sm-title left">{title}</div>
                        <h2 className="twm-large-title site-text-dark">
                            {largeTitle}
                        </h2>
                    </div>

                    <div className="section-content">
                        <div className="row twm-w-steps-section justify-content-center flex-lg-nowrap">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="col-lg col-md-6 m-b30"
                                >
                                    <div className="twm-w-steps">
                                        <div className="twm-w-step-count">
                                            <span>{step.number}</span>
                                        </div>
                                        <div className="twm-w-step-detail">
                                            <h3 className="twm-title">
                                                {step.title}
                                            </h3>
                                            <p>{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="twm-adv-show">
                            <img src={bottomImageUrl} alt="Image" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
