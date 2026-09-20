import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';

export interface LightboxSlide {
    type: 'image' | 'video';
    src: string;
    poster?: string;
    mimeType?: string;
}

interface MediaLightboxProps {
    open: boolean;
    slides: LightboxSlide[];
    index?: number;
    onClose: () => void;
}

export default function MediaLightbox({ open, slides, index = 0, onClose }: MediaLightboxProps) {
    const yarlSlides = slides.map(slide => {
        if (slide.type === 'video') {
            return {
                type: 'video' as const,
                sources: [{ src: slide.src, type: slide.mimeType ?? 'video/mp4' }],
                poster: slide.poster,
            };
        }

        return { src: slide.src };
    });

    return (
        <Lightbox
            open={open}
            close={onClose}
            slides={yarlSlides}
            index={index}
            plugins={[Video]}
        />
    );
}
