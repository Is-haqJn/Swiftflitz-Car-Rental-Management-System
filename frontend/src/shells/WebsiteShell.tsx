import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '@/shared/styles/custom.css';
import { Helmet } from '@dr.pogodin/react-helmet';
import ReactGA from 'react-ga4';
import { MaintenanceGuard } from '@/shared/routes/MaintenanceGuard';
import { useSeoSettings } from '@/shared/hooks/queries/useSettings';
import { WhatsAppFloatingButton } from '@/website/components/WhatsAppFloatingButton';

interface WebsiteShellProps {
    children: ReactNode;
}

function ScrollToTopOnNavigate() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function AnalyticsPageTracker({ gaId }: { gaId: string | undefined }) {
    const { pathname } = useLocation();

    useEffect(() => {
        if (!gaId) return;
        ReactGA.send({ hitType: 'pageview', page: pathname });
    }, [gaId, pathname]);

    return null;
}

function SeoHead() {
    const { data: res } = useSeoSettings();
    const seo = res?.data;

    const gaId = seo?.google_analytics_id;
    const gtmId = seo?.google_tag_manager_id;
    const pixelId = seo?.facebook_pixel_id;
    const robots = seo?.robots ?? 'index, follow';

    useEffect(() => {
        if (gaId) {
            ReactGA.initialize(gaId);
        }
    }, [gaId]);

    return (
        <>
            <AnalyticsPageTracker gaId={gaId} />

            <Helmet>
                {seo?.meta_description && (
                    <meta name="description" content={seo.meta_description} />
                )}
                {seo?.meta_keywords && (
                    <meta name="keywords" content={seo.meta_keywords} />
                )}
                <meta name="robots" content={robots} />
                {seo?.og_image && (
                    <meta property="og:image" content={seo.og_image} />
                )}

                {/* Google Tag Manager */}
                {gtmId && (
                    <script>{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}</script>
                )}

                {/* Facebook Pixel */}
                {pixelId && (
                    <script>{`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}</script>
                )}
            </Helmet>

            {/* GTM noscript fallback */}
            {gtmId && (
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
            )}
        </>
    );
}

export const WebsiteShell = ({ children }: WebsiteShellProps) => {
    return (
        <MaintenanceGuard>
            <SeoHead />
            <ScrollToTopOnNavigate />
            {children}
            <WhatsAppFloatingButton />
        </MaintenanceGuard>
    );
};
