import { Helmet } from '@dr.pogodin/react-helmet';
import { useGeneralSettings } from './queries/useSettings';

/**
 * Sets the document title using Helmet.
 * Returns a <Helmet> element that must be rendered in the component tree.
 *
 * @example
 * const title = useTitle('Dashboard');
 * return <>{title}<div>...</div></>;
 */
export function useTitle(pageTitle: string): React.ReactElement {
    const { data } = useGeneralSettings();
    const siteName = data?.data?.site_name ?? 'Swiftflitz';
    const fullTitle = pageTitle ? `${pageTitle} | ${siteName}` : siteName;

    return (
        <Helmet>
            <title>{fullTitle}</title>
        </Helmet>
    );
}
