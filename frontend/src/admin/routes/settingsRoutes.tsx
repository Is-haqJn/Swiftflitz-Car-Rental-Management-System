import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const GeneralSettings = lazy(() => import('@adminPages/settings/GeneralSettings'));
const RentalSettings = lazy(() => import('@adminPages/settings/RentalSettings'));
const PricingSettings = lazy(() => import('@adminPages/settings/PricingSettings'));
const EmailSettings = lazy(() => import('@adminPages/settings/EmailSettings'));
const WhatsAppSettings = lazy(() => import('@adminPages/settings/WhatsAppSettings'));
const SmsSettings = lazy(() => import('@adminPages/settings/SmsSettings'));
const SeoSettings = lazy(() => import('@adminPages/settings/SeoSettings'));
const PaymentSettings = lazy(() => import('@adminPages/settings/PaymentSettings'));
const BackupMaintenance = lazy(() => import('@adminPages/settings/BackupMaintenance'));
const EmailTemplatesList = lazy(() => import('@adminPages/settings/EmailTemplatesList'));
const EmailTemplateEditor = lazy(() => import('@adminPages/settings/EmailTemplateEditor'));
const WhatsAppTemplatesList = lazy(() => import('@adminPages/settings/WhatsAppTemplatesList'));
const WhatsAppTemplateEditor = lazy(() => import('@adminPages/settings/WhatsAppTemplateEditor'));
const SmsTemplatesList = lazy(() => import('@adminPages/settings/SmsTemplatesList'));
const SmsTemplateEditor = lazy(() => import('@adminPages/settings/SmsTemplateEditor'));
const NotificationSettings = lazy(() => import('@adminPages/notifications/NotificationSettings'));
const PopupSettings = lazy(() => import('@adminPages/settings/PopupSettings'));
const TestEmailNotifications = lazy(() => import('@adminPages/settings/TestEmailNotifications'));
const TestWhatsAppNotifications = lazy(() => import('@adminPages/settings/TestWhatsAppNotifications'));
const TestSmsNotifications = lazy(() => import('@adminPages/settings/TestSmsNotifications'));
const HeaderContent = lazy(() => import('@adminPages/content/HeaderContent'));
const HomepageContent = lazy(() => import('@adminPages/content/HomepageContent'));
const AboutContent = lazy(() => import('@adminPages/content/AboutContent'));
const ContactContent = lazy(() => import('@adminPages/content/ContactContent'));
const FooterContent = lazy(() => import('@adminPages/content/FooterContent'));
const ServicesContent = lazy(() => import('@adminPages/content/ServicesContent'));
const FaqContent = lazy(() => import('@adminPages/content/FaqContent'));
const TermsContent = lazy(() => import('@adminPages/content/TermsContent'));
const PrivacyContent = lazy(() => import('@adminPages/content/PrivacyContent'));

export function SettingsRoutes() {
    return (
        <>
            <Route path="settings">
                <Route
                    path="general"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.VIEW_GENERAL}
                        >
                            <GeneralSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="rental"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_RENTAL}
                        >
                            <RentalSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="pricing"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_PRICING}
                        >
                            <PricingSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="email"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_EMAIL}
                        >
                            <EmailSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="whatsapp"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_WHATSAPP}
                        >
                            <WhatsAppSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="sms"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_SMS}
                        >
                            <SmsSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="seo"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_GENERAL}
                        >
                            <SeoSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="payment"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_PAYMENT}
                        >
                            <PaymentSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="backup"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.MANAGE_BACKUP}
                        >
                            <BackupMaintenance />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="email-templates"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_EMAIL}
                        >
                            <EmailTemplatesList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="email-templates/:key"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_EMAIL}
                        >
                            <EmailTemplateEditor />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="whatsapp-templates"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.SETTINGS.EDIT_WHATSAPP_TEMPLATES
                            }
                        >
                            <WhatsAppTemplatesList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="whatsapp-templates/:key"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.SETTINGS.EDIT_WHATSAPP_TEMPLATES
                            }
                        >
                            <WhatsAppTemplateEditor />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="sms-templates"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_SMS_TEMPLATES}
                        >
                            <SmsTemplatesList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="sms-templates/:key"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.EDIT_SMS_TEMPLATES}
                        >
                            <SmsTemplateEditor />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="notification-settings"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.NOTIFICATIONS.MANAGE_SETTINGS
                            }
                        >
                            <NotificationSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="popups"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <PopupSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="test-email"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.TEST_EMAIL}
                        >
                            <TestEmailNotifications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="test-whatsapp"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.TEST_WHATSAPP}
                        >
                            <TestWhatsAppNotifications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="test-sms"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.SETTINGS.TEST_SMS}
                        >
                            <TestSmsNotifications />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route path="content">
                <Route
                    path="header"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <HeaderContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="homepage"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <HomepageContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="about"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_ABOUT}
                        >
                            <AboutContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="contact"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_CONTACT}
                        >
                            <ContactContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="footer"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <FooterContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="services"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <ServicesContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="faqs"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <FaqContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="terms"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <TermsContent />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="privacy"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <PrivacyContent />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </>
    );
}
