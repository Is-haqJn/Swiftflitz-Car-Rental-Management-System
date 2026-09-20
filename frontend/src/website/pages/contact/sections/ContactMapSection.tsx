import { cn } from '@/shared/libs/utils';
import { useContactSettings } from '@/shared/hooks/queries/useSettings';

const DEFAULT_MAP_URL =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248.14311100038356!2d-0.16490254551170055!3d5.671178366243357!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9d002d8eeab3%3A0xd57091bba30b6eb4!2sSwiftFlitz%20Rental!5e0!3m2!1sen!2sgh!4v1776273665215!5m2!1sen!2sgh';

export const ContactMapSection = ({
    mapClassName,
    className,
}: {
    mapClassName?: string;
    className?: string;
}) => {
    const { data: res } = useContactSettings();
    const s = res?.data ?? {};

    if (s.map_enabled === false) return null;

    return (
        <div className={cn('gmap-outline', className)}>
            <iframe
                className={cn('', mapClassName)}
                src={s.map_embed_url || DEFAULT_MAP_URL}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
            ></iframe>
        </div>
    );
};
