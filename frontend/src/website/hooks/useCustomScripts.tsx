/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
    interface Window {
        jQuery?: any;
        $?: any;
        Swiper?: any;
        WOW?: any;
        Waypoint?: any;
        lc_lightbox?: any;
        bootstrap?: any;
        newsTicker?: any;
    }
}

const useCustomScripts = (isLoaded: boolean) => {
    const location = useLocation();

    useEffect(() => {
        if (!isLoaded || !window.jQuery) return;

        const $ = window.jQuery;

        /* Owl Carousel helpers */
        function av_categories_carousel() {
            const $el = $('.twm-categories-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: true,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    1200: { items: 3 },
                },
            });
        }

        function av_categories2_carousel() {
            const $el = $('.twm-categories2-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: true,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    640: { items: 2 },
                    767: { items: 3 },
                    1024: { items: 4 },
                    1200: { items: 6 },
                },
            });
        }

        function twm_popular_vehicles_slider() {
            const $el = $('.twm-popular-vehicles-slider');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: true,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    1200: { items: 4 },
                },
            });
        }

        function av_blog_carousel() {
            const $el = $('.twm-blog-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: true,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    1200: { items: 3 },
                },
            });
        }

        function av_team_carousel() {
            const $el = $('.twm-team-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: true,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    1200: { items: 4 },
                },
            });
        }

        function twm_vehicle_fleet_carousel() {
            const $el = $('.twm-vehicle-fleet-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: true,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    1200: { items: 3 },
                },
            });
        }

        function twm_vehicle_fleet2_carousel() {
            const $el = $('.twm-vehicle-fleet2-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                autoplay: false,
                margin: 30,
                autoplayTimeout: 3000,
                nav: true,
                dots: false,
                navText: [
                    '<i class="feather feather-chevron-left"></i>',
                    '<i class="feather feather-chevron-right"></i>',
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 1 },
                    1200: { items: 1 },
                },
            });
        }

        function home_client_carousel() {
            const $el = $('.home-client-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                nav: false,
                dots: true,
                margin: 5,
                autoplay: true,
                navText: [
                    '<i class="fa fa-angle-left"></i>',
                    '<i class="fa fa-angle-right"></i>',
                ],
                responsive: {
                    0: { items: 2 },
                    480: { items: 3 },
                    767: { items: 4 },
                    1000: { items: 4 },
                },
            });
        }

        function home_client_carousel_3() {
            const $el = $('.home-client-carousel3');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                nav: false,
                dots: false,
                margin: 30,
                autoplay: true,
                autoplayTimeout: 1500,
                navText: [
                    '<i class="fa fa-angle-left"></i>',
                    '<i class="fa fa-angle-right"></i>',
                ],
                responsive: {
                    0: { items: 2 },
                    480: { items: 3 },
                    767: { items: 4 },
                    1000: { items: 6 },
                },
            });
        }

        function blog_list_carousel() {
            const $el = $('.blog-list-carousel');
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            $el.owlCarousel({
                loop: true,
                nav: true,
                dots: false,
                margin: 30,
                autoplay: true,
                autoplayTimeout: 2500,
                navText: [
                    '<i class="fa fa-angle-left"></i>',
                    '<i class="fa fa-angle-right"></i>',
                ],
                responsive: { 0: { items: 1 } },
            });
        }

        /* Counter */
        function counter_section() {
            if ($.fn.counterUp) {
                $('.counter').counterUp({ delay: 10, time: 3000 });
            }
        }

        /* Date / Time pickers */
        function date_time_input() {
            if (/Mobi/.test(navigator.userAgent)) {
                $('.date input').attr('type', 'date');
                $('.time input').attr('type', 'time');
            } else {
                if ($.fn.datetimepicker) {
                    $('.datepicker').datetimepicker({
                        useCurrent: false,
                        format: 'DD-MMM-YYYY',
                        showTodayButton: true,
                        icons: {
                            next: 'fa fa-chevron-right',
                            previous: 'fa fa-chevron-left',
                            today: 'fa fa-clock',
                        },
                    });
                    $('.timepicker').datetimepicker({
                        format: 'LT',
                        icons: {
                            up: 'fa fa-chevron-up',
                            down: 'fa fa-chevron-down',
                        },
                    });
                }
            }
        }

        /* Video / Media */
        function video_responsive() {
            $('iframe[src*="youtube.com"]').wrap(
                '<div class="embed-responsive embed-responsive-16by9"></div>'
            );
            $('iframe[src*="vimeo.com"]').wrap(
                '<div class="embed-responsive embed-responsive-16by9"></div>'
            );
        }

        function magnific_video() {
            if ($.fn.magnificPopup) {
                $('.mfp-video').magnificPopup({ type: 'iframe' });
            }
        }

        /* Modals */
        function popup_vertical_center() {
            function reposition(this: any) {
                const modal = $(this);
                const dialog = modal.find('.modal-dialog');
                modal.css('display', 'block');
                dialog.css(
                    'margin-top',
                    Math.max(0, ($(window).height() - dialog.height()) / 2)
                );
            }
            $('.modal').on('show.bs.modal', reposition);
            $(window).on('resize.modal', function () {
                $('.modal:visible').each(reposition);
            });
        }

        /* Sticky header / sidebar */
        function sticky_header() {
            if ($('.sticky-header').length && window.Waypoint?.Sticky) {
                new window.Waypoint.Sticky({ element: $('.sticky-header') });
            }
        }

        function sticky_sidebar() {
            if ($.fn.theiaStickySidebar) {
                $('.sticky-sidebar').theiaStickySidebar({
                    additionalMarginTop: 100,
                });
            }
        }

        /* Scroll to top */
        function scroll_top() {
            $('button.scroltop').on('click.scrolltop', function () {
                $('html, body').animate({ scrollTop: 0 }, 1000);
                return false;
            });
            $(window).on('scroll.scrolltop', function () {
                if ($(window).scrollTop() > 900) {
                    $('button.scroltop').fadeIn(1000);
                } else {
                    $('button.scroltop').fadeOut(1000);
                }
            });
        }

        /* Mobile navigation */
        function mobile_nav() {
            $('.sub-menu, .mega-menu').parent('li').addClass('has-child');
            $(
                "<div class='fa fa-angle-right submenu-toogle'></div>"
            ).insertAfter('.has-child > a');
            $('.has-child a+.submenu-toogle').on(
                'click.mobilenav',
                function (this: any, ev: Event) {
                    $(this)
                        .parent()
                        .siblings('.has-child')
                        .children('.sub-menu, .mega-menu')
                        .slideUp(500, function (this: any) {
                            $(this).parent().removeClass('nav-active');
                        });
                    $(this)
                        .next($('.sub-menu, .mega-menu'))
                        .slideToggle(500, function (this: any) {
                            $(this).parent().toggleClass('nav-active');
                        });
                    ev.stopPropagation();
                }
            );
        }

        function mobile_side_drawer() {
            $('#mobile-side-drawer').on('click.drawer', function () {
                $('.mobile-sider-drawer-menu').toggleClass('active');
            });
        }

        /* Search bar */
        function site_search() {
            $('a[href="#search"]').on('click.search', function (event: Event) {
                event.preventDefault();
                $('#search').addClass('open');
                $('#search > form > input[type="search"]').focus();
            });
            $('#search, #search button.close').on(
                'click.search keyup.search',
                function (this: any, event: any) {
                    if (
                        event.target === this ||
                        event.target.className === 'close'
                    ) {
                        $(this).removeClass('open');
                    }
                }
            );
        }

        /* Swiper sliders */
        function swiper_gallery() {
            if (!window.Swiper || !$('.twm-gallery-thumbs').length) return;
            const thumbsEl = document.querySelector(
                '.twm-gallery-thumbs'
            ) as any;
            const topEl = document.querySelector('.twm-gallery-top') as any;
            if (thumbsEl?.swiper) thumbsEl.swiper.destroy(true, true);
            if (topEl?.swiper) topEl.swiper.destroy(true, true);
            const galleryThumbs = new window.Swiper('.twm-gallery-thumbs', {
                centeredSlides: false,
                centeredSlidesBounds: true,
                loop: true,
                spaceBetween: 30,
                slidesPerView: 4,
                freeMode: false,
                watchSlidesVisibility: true,
                watchSlidesProgress: true,
                watchOverflow: true,
                breakpoints: {
                    0: { slidesPerView: 2 },
                    480: { slidesPerView: 3 },
                    768: { slidesPerView: 4 },
                    1024: { slidesPerView: 4 },
                    1365: { slidesPerView: 4 },
                },
            });
            const galleryTop = new window.Swiper('.twm-gallery-top', {
                direction: 'horizontal',
                spaceBetween: 0,
                loop: true,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                thumbs: { swiper: galleryThumbs },
            });
            galleryTop.on('slideChangeTransitionStart', function () {
                galleryThumbs.slideTo(galleryTop.activeIndex);
            });
            galleryThumbs.on('transitionStart', function () {
                galleryTop.slideTo(galleryThumbs.activeIndex);
            });
        }

        function swiper_dealer_list() {
            if (!window.Swiper || !$('.swiper-dealer-list').length) return;
            const el = document.querySelector('.swiper-dealer-list') as any;
            if (el?.swiper) el.swiper.destroy(true, true);
            new window.Swiper('.swiper-dealer-list', {
                freeMode: false,
                slidesPerView: 6,
                centeredSlides: true,
                paginationClickable: true,
                loop: true,
                spaceBetween: 30,
                slideToClickedSlide: true,
                autoplay: { delay: 2000, disableOnInteraction: false },
                breakpoints: {
                    0: { slidesPerView: 1 },
                    480: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1365: { slidesPerView: 6 },
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
            });
        }

        function swiper_dealer_list2() {
            if (!window.Swiper || !$('.swiper-dealer-list2').length) return;
            const el = document.querySelector('.swiper-dealer-list2') as any;
            if (el?.swiper) el.swiper.destroy(true, true);
            new window.Swiper('.swiper-dealer-list2', {
                freeMode: false,
                slidesPerView: 6,
                centeredSlides: false,
                paginationClickable: true,
                loop: true,
                spaceBetween: 30,
                slideToClickedSlide: true,
                autoplay: { delay: 2000, disableOnInteraction: false },
                breakpoints: {
                    0: { slidesPerView: 1 },
                    480: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1365: { slidesPerView: 6 },
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
            });
        }

        /* WOW animations */
        function wow_animation() {
            if (!window.WOW) return;
            new window.WOW({ animateClass: 'animated', offset: 100 }).init();
        }

        /* Lightbox */
        function lightbox_popup() {
            if (window.lc_lightbox) {
                window.lc_lightbox('.elem', {
                    wrap_class: 'lcl_fade_oc',
                    gallery: true,
                    thumb_attr: 'data-lcl-thumb',
                    skin: 'minimal',
                    radius: 0,
                    padding: 0,
                    border_w: 0,
                });
            }
        }

        /* Progress bars */
        function progress_bar_tooltips() {
            if ($.fn.tooltip) {
                $('[data-toggle="tooltips"]')
                    .tooltip({ trigger: 'manual' })
                    .tooltip('show');
            }
        }

        function progress_bar_width() {
            $(window).on('scroll.progressbar', function () {
                $('.progress-bar').each(function (this: any) {
                    const val = $(this).attr('aria-valuenow');
                    $(this).width(val + '%');
                });
            });
        }

        /* Masonry / Isotope */
        function masonryBox() {
            if (!$.fn.isotope) return;
            const $container = $('.masonry-outer');
            $container.isotope({
                itemSelector: '.masonry-item',
                transitionDuration: '1s',
                originLeft: true,
                stamp: '.stamp',
            });
            $container.imagesLoaded().progress(function () {
                $container.isotope('layout');
            });
            $('.masonry-filter li').on('click.masonry', function (this: any) {
                const selector = $(this).find('a').attr('data-filter');
                $('.masonry-filter li').removeClass('active');
                $(this).addClass('active');
                $container.isotope({ filter: selector });
                return false;
            });
        }

        /* Custom scrollbar */
        function custom_scrollbar() {
            if ($.fn.mCustomScrollbar) {
                $('.content').mCustomScrollbar();
            }
        }

        /* Header color on scroll */
        function color_fill_header() {
            const scroll = $(window).scrollTop();
            if (scroll >= 100) {
                $('.main-bar').addClass('color-fill');
            } else {
                $('.main-bar').removeClass('color-fill');
            }
        }

        /* Page loader */
        function page_loader() {
            $('.loading-area').fadeOut(1000);
        }

        /* Bootstrap tooltips */
        function bootstrap_tooltips() {
            if (!window.bootstrap?.Tooltip) return;
            const triggers = [].slice.call(
                document.querySelectorAll('[data-bs-toggle="tooltip"]')
            );
            triggers.forEach((el: Element) => new window.bootstrap.Tooltip(el));
        }

        /* Filter style switcher */
        $('.switch-btn').on('click.switcher', function () {
            $('.styleswitcher').toggleClass('active');
        });

        /* TypeWriter */
        class TypeWriter {
            txtElement: Element;
            words: string[];
            wait: number;
            txt: string;
            wordIndex: number;
            isDeleting: boolean;

            constructor(txtElement: Element, words: string[], wait = 3000) {
                this.txtElement = txtElement;
                this.words = words;
                this.txt = '';
                this.wordIndex = 0;
                this.wait = parseInt(String(wait), 10);
                this.isDeleting = false;
                this.type();
            }

            type() {
                const current = this.wordIndex % this.words.length;
                const fullTxt = this.words[current];
                if (this.isDeleting) {
                    this.txt = fullTxt.substring(0, this.txt.length - 1);
                } else {
                    this.txt = fullTxt.substring(0, this.txt.length + 1);
                }
                this.txtElement.innerHTML = `<span class="txt">${this.txt}</span>`;
                let typeSpeed = 100;
                if (this.isDeleting) typeSpeed /= 2;
                if (!this.isDeleting && this.txt === fullTxt) {
                    typeSpeed = this.wait;
                    this.isDeleting = true;
                } else if (this.isDeleting && this.txt === '') {
                    this.isDeleting = false;
                    this.wordIndex++;
                    typeSpeed = 500;
                }
                setTimeout(() => this.type(), typeSpeed);
            }
        }

        const txtElement = document.querySelector('.txt-type');
        if (txtElement) {
            const words = JSON.parse(
                txtElement.getAttribute('data-words') ?? '[]'
            );
            // Only initialise if data-words was provided and non-empty.
            // When words are managed by the React typewriter effect,
            // data-words is absent and we skip this block entirely.
            if (words.length > 0) {
                const wait = txtElement.getAttribute('data-wait') ?? 3000;
                new TypeWriter(txtElement, words, Number(wait));
            }
        }

        /* Ticker news */
        if ($('#T1').length && $.fn.newsTicker) {
            let timer: ReturnType<typeof setTimeout> | false = false;
            const _Ticker = $('#T1').newsTicker();
            _Ticker.on('mouseenter.ticker', function (this: any) {
                const self = this;
                timer = setTimeout(function () {
                    self.pauseTicker();
                }, 10);
            });
            _Ticker.on('mouseleave.ticker', function (this: any) {
                if (timer) clearTimeout(timer);
                if (!timer) return false;
                this.startTicker();
            });
        }

        /* Contact form */
        $(document).on(
            'submit.contactform',
            'form.cons-contact-form',
            function (this: any, e: Event) {
                e.preventDefault();
                const form = $(this);
                $.ajax({
                    url: 'https://thewebmax.org/carntel/phpmailer/mail.php',
                    data: form.serialize() + '&action=contactform',
                    type: 'POST',
                    dataType: 'JSON',
                    beforeSend: function () {
                        $('.loading-area').show();
                    },
                    success: function (data: any) {
                        $('.loading-area').hide();
                        const cls = data.success
                            ? 'alert-success'
                            : 'alert-danger';
                        $(
                            `<div class="alert ${cls}">${data.message}</div>`
                        ).insertBefore('form.cons-contact-form');
                    },
                });
                $('.cons-contact-form').trigger('reset');
                return false;
            }
        );

        /* Run all on ready */
        av_categories_carousel();
        av_categories2_carousel();
        twm_popular_vehicles_slider();
        av_blog_carousel();
        av_team_carousel();
        twm_vehicle_fleet_carousel();
        twm_vehicle_fleet2_carousel();
        counter_section();
        date_time_input();
        site_search();
        video_responsive();
        magnific_video();
        popup_vertical_center();
        sticky_header();
        sticky_sidebar();
        scroll_top();
        mobile_nav();
        mobile_side_drawer();
        home_client_carousel();
        wow_animation();
        lightbox_popup();
        home_client_carousel_3();
        blog_list_carousel();
        swiper_gallery();
        swiper_dealer_list();
        swiper_dealer_list2();
        bootstrap_tooltips();
        custom_scrollbar();

        /* Run on window load */
        const onLoad = () => {
            masonryBox();
            color_fill_header();
            progress_bar_tooltips();
            progress_bar_width();
            page_loader();
        };

        if (document.readyState === 'complete') {
            onLoad();
        } else {
            $(window).on('load.custom', onLoad);
        }

        /* Run on scroll */
        $(window).on('scroll.colorheader', color_fill_header);

        /* Cleanup */
        return () => {
            $(window).off('load.custom');
            $(window).off('scroll.colorheader');
            $(window).off('scroll.scrolltop');
            $(window).off('scroll.progressbar');
            $(window).off('resize.modal');
            $('button.scroltop').off('click.scrolltop');
            $('.switch-btn').off('click.switcher');
            $('.has-child a+.submenu-toogle').off('click.mobilenav');
            $('#mobile-side-drawer').off('click.drawer');
            $('a[href="#search"]').off('click.search');
            $('#search, #search button.close').off('click.search keyup.search');
            $('.modal').off('show.bs.modal');
            $('.masonry-filter li').off('click.masonry');
            $('#T1').off('mouseenter.ticker mouseleave.ticker');
            $(document).off('submit.contactform');
        };
    }, [isLoaded, location.pathname]);
};

export default useCustomScripts;
