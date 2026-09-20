import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import DefaultLayout from '../layouts/DefaultLayout';
import { Error404Page } from '../pages/errors/404';
import Home from '../pages/home';
const AirportTransfer = lazy(() => import('@/website/pages/services/airport-transfer'));
const QuoteRequestPage = lazy(() => import('../pages/quote-request'));
const ConfirmQuotePage = lazy(() => import('../pages/confirm-quote'));
const ReuploadDocumentsPage = lazy(() => import('../pages/reupload-documents'));
const VerifyBookingPage = lazy(() => import('../pages/verify-booking'));
const CompleteProfilePage = lazy(() => import('../pages/complete-profile'));
const Listings = lazy(() => import('@/website/pages/listings'));
const ChauffeurServices = lazy(() => import('@/website/pages/chauffeur-services'));
const ChauffeurVehicleDetail = lazy(
    () => import('@/website/pages/chauffeur-services/detail'),
);
const ChauffeurBookingConfirmation = lazy(
    () => import('@/website/pages/chauffeur-services/ChauffeurBookingConfirmation'),
);
const VehicleDetail = lazy(() =>
    import('@/website/pages/listings/vehicledetails').then((m) => ({
        default: m.VehicleDetail,
    })),
);
const QuoteRequestBooking = lazy(() =>
    import('@/website/pages/listings/vehicledetails').then((m) => ({
        default: m.QuoteRequestBooking,
    })),
);
const BookingConfirmation = lazy(() =>
    import('@/website/pages/listings/vehicledetails/BookingConfirmation').then((m) => ({
        default: m.BookingConfirmation,
    })),
);
const About = lazy(() => import('../pages/about'));
const AllServices = lazy(() =>
    import('../pages/services/all-services').then((m) => ({ default: m.AllServices })),
);
const Faqs = lazy(() => import('../pages/faqs'));
const ContactUs = lazy(() => import('../pages/contact'));
const PaymentPage = lazy(() => import('../pages/payment/PaymentPage'));
const PaymentCancelledPage = lazy(() => import('../pages/payment/PaymentCancelledPage'));
const TermsPage = lazy(() => import('@/website/pages/terms'));
const PrivacyPage = lazy(() => import('@/website/pages/privacy'));
const TrackingPage = lazy(() => import('@/website/pages/tracking'));
const TrackingDetail = lazy(() => import('@/website/pages/tracking/TrackingDetail'));

export const WebsiteRoutes = () => {
    return (
        <DefaultLayout>
            <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
                <Routes>
                    <Route index element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/listings" element={<Listings />} />
                    <Route
                        path="/listings/:id/confirm"
                        element={<BookingConfirmation />}
                    />
                    <Route
                        path="/listings/:id/quote-request"
                        element={<QuoteRequestBooking />}
                    />
                    <Route path="/listings/:id" element={<VehicleDetail />} />
                    <Route path="/services" element={<AllServices />} />
                    <Route
                        path="/chauffeur-services/:id/confirm"
                        element={<ChauffeurBookingConfirmation />}
                    />
                    <Route
                        path="/chauffeur-services/:id"
                        element={<ChauffeurVehicleDetail />}
                    />
                    <Route
                        path="/chauffeur-services"
                        element={<ChauffeurServices />}
                    />
                    <Route path="/airport-transfer" element={<AirportTransfer />} />
                    <Route path="/faqs" element={<Faqs />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/quote-request" element={<QuoteRequestPage />} />
                    <Route
                        path="/confirm-quote/:token"
                        element={<ConfirmQuotePage />}
                    />
                    <Route
                        path="/reupload-documents/:token"
                        element={<ReuploadDocumentsPage />}
                    />
                    <Route
                        path="/verify-booking/:token"
                        element={<VerifyBookingPage />}
                    />
                    <Route
                        path="/complete-profile/:token"
                        element={<CompleteProfilePage />}
                    />
                    <Route
                        path="/payment/:transactableType/:transactableId"
                        element={<PaymentPage />}
                    />
                    <Route
                        path="/payment/cancelled"
                        element={<PaymentCancelledPage />}
                    />
                    <Route path="/track" element={<TrackingPage />} />
                    <Route path="/track/:reference" element={<TrackingDetail />} />
                    <Route path="*" element={<Error404Page />} />
                </Routes>
            </Suspense>
        </DefaultLayout>
    );
};
