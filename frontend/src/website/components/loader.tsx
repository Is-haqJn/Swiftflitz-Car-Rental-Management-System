import { cn } from '@/shared/libs/utils';

interface LoaderProps {
    loaderImage?: string;
    className?: string;
}

export const Loader = ({ loaderImage, className }: LoaderProps) => {
    return (
        <div className={cn('loading-area', className)}>
            <div className="loading-box"></div>
            <div className="loading-pic">
                <img
                    className="loader-gif"
                    src={
                        loaderImage ||
                        `${import.meta.env.BASE_URL}assets/images/loader-car.gif`
                    }
                    alt="loader Image"
                />
            </div>
        </div>
    );
};
