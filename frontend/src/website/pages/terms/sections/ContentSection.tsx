import DOMPurify from 'dompurify';
import { useTermsSettings } from '@/shared/hooks/queries/useSettings';

export const ContentSection = () => {
    const { data: res, isLoading } = useTermsSettings();
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
                        Terms & Conditions content coming soon.
                    </p>
                </div>
            </div>
        );
    }

    const overtimeRate = res?.data?.chauffeur_overtime_rate;
    const rendered = content.replace(
        /\{\{chauffeur_overtime_rate\}\}/g,
        overtimeRate != null
            ? `GHS ${overtimeRate}`
            : 'the applicable overtime rate'
    );

    return (
        <div className="section-full p-t80 p-b80 site-bg-white">
            <div className="container">
                <div
                    className="twm-terms-content"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(rendered),
                    }}
                />
            </div>
        </div>
    );
};
