interface pageStylesProps {
    href: string;
    id?: string;
    media?: string;
    appendTo?: 'head' | 'body';
}

interface pageScriptsProps {
    src: string;
    async?: boolean;
    appendTo?: 'head' | 'body';
}

export const pageScripts: pageScriptsProps[] = [
    { src: `${import.meta.env.BASE_URL}assets/js/jquery-3.7.1.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/popper.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/bootstrap.min.js` },
    {
        src: `${import.meta.env.BASE_URL}assets/js/magnific-popup.min.js`,
    },
    { src: `${import.meta.env.BASE_URL}assets/js/waypoints.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/waypoints-sticky.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/isotope.pkgd.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/imagesloaded.pkgd.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/owl.carousel.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/theia-sticky-sidebar.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/lc_lightbox.lite.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/swiper-bundle.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/wow.min.js` },
    // { src: `${import.meta.env.BASE_URL}assets/js/custom.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/tickerNews.min.js` },
    { src: `${import.meta.env.BASE_URL}assets/js/moment.min.js` },
    {
        src: `${import.meta.env.BASE_URL}assets/js/bootstrap-datetimepicker.min.js`,
    },
    {
        src: `${import.meta.env.BASE_URL}assets/js/jquery.mCustomScrollbar.concat.min.js`,
    },
];

export const pageStyles: pageStylesProps[] = [
    { href: `${import.meta.env.BASE_URL}assets/css/bootstrap.min.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/animate.min.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/font-awesome.min.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/lc_lightbox.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/feather.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/owl.carousel.min.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/magnific-popup.min.css` },
    { href: `${import.meta.env.BASE_URL}assets/css/swiper-bundle.min.css` },
    {
        href: `${import.meta.env.BASE_URL}assets/css/bootstrap-datetimepicker.min.css`,
    },
    { href: `${import.meta.env.BASE_URL}assets/css/style.css` },
    {
        href: `${import.meta.env.BASE_URL}assets/css/jquery.mCustomScrollbar.min.css`,
    },
];
