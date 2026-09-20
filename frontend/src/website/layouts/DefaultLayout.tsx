import type { ReactNode } from 'react';
import { Footer } from '../components/layout/footer';
import { Header } from '../components/layout/header';
import { ScrollToTop } from '../components/layout/scrollToTop';
import useMultiStyle from '../hooks/useMultiStyle';
import { pageScripts, pageStyles } from '../constants/assets';
import useMultiScript from '../hooks/useMultiScript';
import useCustomScripts from '../hooks/useCustomScripts';
import { Loader } from '../components/loader';
import { useTitle } from '@/shared/hooks';

interface DefaultLayoutProps {
    children?: ReactNode;
}

const DefaultLayout = ({ children }: DefaultLayoutProps) => {
    const title = useTitle('Swiftflitz Rentals');
    const { isLoaded: isStyleLoaded } = useMultiStyle(pageStyles);
    const { isLoaded } = useMultiScript(pageScripts, { sequential: true });
    useCustomScripts(isLoaded);

    //? show loader
    if (!isLoaded || !isStyleLoaded) {
        return <Loader className={'full-screen-loader'} />;
    }

    return (
        <>
            {title}
            {/* Loader */}
            <div className="page-wraper">
                {/* Header */}
                <Header />
                <div className="page-content">{children}</div>
                {/* Footer */}
                <Footer />
                {/* Scroll top button */}
                <ScrollToTop />
            </div>
        </>
    );
};

export default DefaultLayout;
