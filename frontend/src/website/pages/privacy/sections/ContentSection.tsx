import DOMPurify from 'dompurify';
import { usePrivacySettings } from '@/shared/hooks/queries/useSettings';

export const ContentSection = () => {
    const { data: res, isLoading } = usePrivacySettings();
    const content = res?.data?.content ?? '';

    if (isLoading) {
        return (
            <div className="section-full p-t80 p-b80 site-bg-white">
                <div className="container">
                    <div className="text-center py-5 text-muted">Loading…</div>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="section-full p-t80 p-b80 site-bg-white">
                <div className="container">
                    <p className="text-muted text-center py-5">
                        Privacy Policy content coming soon.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="section-full p-t80 p-b80 site-bg-white">
            <div className="container">
                <div
                    className="twm-terms-content"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(content),
                    }}
                />
            </div>
        </div>
    );
};
