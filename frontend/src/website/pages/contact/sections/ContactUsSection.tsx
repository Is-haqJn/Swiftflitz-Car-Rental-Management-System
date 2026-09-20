import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    useContactSettings,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import { LuHouse, LuMail, LuPhoneCall } from 'react-icons/lu';
import { FaCheck } from 'react-icons/fa6';
import { publicQuoteService } from '@/services/publicQuoteService';

const SECTION_BG_IMAGE_FALLBACK = '/assets/images/contact-section-bg.jpg';

interface ContactFormFields {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    message: string;
}

function ContactForm() {
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ContactFormFields>();

    const onSubmit = async (data: ContactFormFields) => {
        setSubmitting(true);
        setServerError(null);
        try {
            await publicQuoteService.submitContactForm(data);
            setSubmitted(true);
        } catch {
            setServerError(
                'Something went wrong. Please try again or contact us directly.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="twm-contact-page-detail">
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>
                        <FaCheck />
                    </div>
                    <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
                        Message Sent!
                    </h3>
                    <p
                        style={{
                            color: '#6b7280',
                            lineHeight: 1.7,
                            maxWidth: 340,
                            margin: '0 auto',
                        }}
                    >
                        Thank you for reaching out. Your message has been
                        received and a member of our team will review it and get
                        back to you as soon as possible.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="twm-contact-page-detail">
            <div className="section-head left">
                <h2 className="twm-large-title">Contact Form</h2>
                <p className="p-text">
                    Fill in your details below and we'll get back to you as soon
                    as possible.
                </p>
            </div>

            <div className="twm-contact-page-form">
                <div className="contact-form-outer">
                    <form
                        className="cons-contact-form"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className="row">
                            <div className="col-lg-6 col-md-6">
                                <div className="form-group mb-4">
                                    <input
                                        {...register('first_name', {
                                            required: 'First name is required',
                                        })}
                                        type="text"
                                        className={`form-control${errors.first_name ? ' is-invalid' : ''}`}
                                        placeholder="First Name"
                                    />
                                    {errors.first_name && (
                                        <div className="invalid-feedback">
                                            {errors.first_name.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-6 col-md-6">
                                <div className="form-group mb-4">
                                    <input
                                        {...register('last_name', {
                                            required: 'Last name is required',
                                        })}
                                        type="text"
                                        className={`form-control${errors.last_name ? ' is-invalid' : ''}`}
                                        placeholder="Last Name"
                                    />
                                    {errors.last_name && (
                                        <div className="invalid-feedback">
                                            {errors.last_name.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-12 col-md-12">
                                <div className="form-group mb-4">
                                    <input
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^\S+@\S+\.\S+$/,
                                                message: 'Enter a valid email',
                                            },
                                        })}
                                        type="email"
                                        className={`form-control${errors.email ? ' is-invalid' : ''}`}
                                        placeholder="Email Address"
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback">
                                            {errors.email.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-12 col-md-12">
                                <div className="form-group mb-4">
                                    <input
                                        {...register('phone', {
                                            required:
                                                'Phone number is required',
                                        })}
                                        type="tel"
                                        className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                                        placeholder="Phone Number"
                                    />
                                    {errors.phone && (
                                        <div className="invalid-feedback">
                                            {errors.phone.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-12">
                                <div className="form-group mb-5">
                                    <textarea
                                        {...register('message', {
                                            required: 'Message is required',
                                        })}
                                        className={`form-control${errors.message ? ' is-invalid' : ''}`}
                                        rows={4}
                                        placeholder="How can we help you?"
                                    />
                                    {errors.message && (
                                        <div className="invalid-feedback">
                                            {errors.message.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {serverError && (
                                <div className="col-md-12 mb-3">
                                    <div
                                        className="alert alert-danger"
                                        style={{ fontSize: 13 }}
                                    >
                                        {serverError}
                                    </div>
                                </div>
                            )}

                            <div className="col-md-12">
                                <button
                                    type="submit"
                                    className="site-button dark-bg"
                                    disabled={submitting}
                                >
                                    <em>
                                        {submitting
                                            ? 'Sending…'
                                            : 'Send Message'}
                                    </em>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export const ContactUsSection = () => {
    const { data: res } = useContactSettings();
    const { data: generalRes } = useGeneralSettings();
    const s = res?.data ?? {};
    const g = generalRes?.data ?? {};

    const largeTitle = s.contact_section_large_title ?? 'Get In Touch';
    const bgImage = s.contact_section_bg_image_url ?? SECTION_BG_IMAGE_FALLBACK;
    const socialsEnabled = s.contact_socials_enabled !== false;
    const socialsTitle = s.contact_socials_title ?? 'Follow Us';
    const socials = s.contact_socials ?? [];

    const infoItems = [
        {
            Icon: LuPhoneCall,
            label: 'Phone',
            value: g.site_phone,
            href: g.site_phone ? `tel:${g.site_phone}` : undefined,
        },
        {
            Icon: LuMail,
            label: 'Email',
            value: g.site_email,
            href: g.site_email ? `mailto:${g.site_email}` : undefined,
        },
        {
            Icon: LuHouse,
            label: 'Address',
            value: g.site_address,
            href: undefined,
        },
    ].filter(item => item.value?.trim());

    return (
        <>
            <div className="section-full p-t150 p-b120 site-bg-white twm-contact-section-wrap">
                <div className="container">
                    <div className="section-content">
                        <div className="twm-contact-section">
                            <div className="row">
                                <div className="col-xl-7 col-lg-6 col-md-12">
                                    <div className="twm-maskingtext m-b50">
                                        <h1>{largeTitle}</h1>
                                        <img src={bgImage} alt="Background" />
                                    </div>
                                    <div className="twm-get-info-wrap">
                                        <ul>
                                            {infoItems.map((item, index) => (
                                                <li key={index}>
                                                    <div className="twm-get-info">
                                                        <div className="twm-media">
                                                            <item.Icon
                                                                size={24}
                                                            />
                                                        </div>
                                                        <div className="twm-content">
                                                            <p>{item.label}</p>
                                                            <h3 className="twm-title">
                                                                {item.href ? (
                                                                    <a
                                                                        href={
                                                                            item.href
                                                                        }
                                                                    >
                                                                        {
                                                                            item.value
                                                                        }
                                                                    </a>
                                                                ) : (
                                                                    item.value
                                                                )}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        {socialsEnabled && (
                                            <div className="twm-social">
                                                <h3 className="twm-title">
                                                    {socialsTitle}
                                                </h3>
                                                <ul>
                                                    {socials.map(
                                                        (social, index) => {
                                                            const IconComp =
                                                                social.icon
                                                                    ? FEATURE_ICON_MAP[
                                                                          social
                                                                              .icon
                                                                      ]
                                                                    : null;
                                                            return (
                                                                <li key={index}>
                                                                    <a
                                                                        href={
                                                                            social.url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        {IconComp ? (
                                                                            <i
                                                                                style={{
                                                                                    display:
                                                                                        'flex',
                                                                                    alignItems:
                                                                                        'center',
                                                                                    justifyContent:
                                                                                        'center',
                                                                                }}
                                                                            >
                                                                                <IconComp
                                                                                    size={
                                                                                        18
                                                                                    }
                                                                                    color="currentColor"
                                                                                />
                                                                            </i>
                                                                        ) : null}
                                                                    </a>
                                                                </li>
                                                            );
                                                        }
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-xl-5 col-lg-6 col-md-12">
                                    <ContactForm />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
