import { useScrollLock } from '@/shared/hooks';
import { useEffect, Fragment, type JSX, type ReactNode } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { cn } from '@/shared/libs/utils';
import { VscClose } from 'react-icons/vsc';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    className?: string;
}

//? use custom tailwind prefix tw:
const sizeStyles = {
    sm: 'tw:max-w-md',
    md: 'tw:max-w-lg',
    lg: 'tw:max-w-xl',
    xl: 'tw:max-w-2xl',
    full: 'tw:w-full tw:mx-4',
};

export const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    className,
}: ModalProps): JSX.Element => {
    const { lock, unlock } = useScrollLock();

    useEffect(() => {
        if (isOpen) {
            lock();
        } else {
            unlock();
        }

        return () => unlock();
    }, [isOpen, lock, unlock]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="tw:relative tw:z-50"
                onClose={closeOnOverlayClick ? onClose : () => {}}
            >
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="tw:ease-out tw:duration-300"
                    enterFrom="tw:opacity-0"
                    enterTo="tw:opacity-100"
                    leave="tw:ease-in tw:duration-200"
                    leaveFrom="tw:opacity-100"
                    leaveTo="tw:opacity-0"
                >
                    <div className="tw:fixed tw:inset-0 tw:bg-black/30 tw:backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
                    <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="tw:ease-out tw:duration-300"
                            enterFrom="tw:opacity-0 tw:scale-95"
                            enterTo="tw:opacity-100 tw:scale-100"
                            leave="tw:ease-in tw:duration-200"
                            leaveFrom="tw:opacity-100 tw:scale-100"
                            leaveTo="tw:opacity-0 tw:scale-95"
                        >
                            <Dialog.Panel
                                className={cn(
                                    'tw:w-full tw:transform overflow-hidden rounded tw:shadow tw:transition-all tw:bg-white tw:bg-blend-multiply p-3',
                                    sizeStyles[size],
                                    className
                                )}
                            >
                                {/* Header */}
                                {(title || showCloseButton) && (
                                    <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                                        <div>
                                            {title && (
                                                <Dialog.Title className="h5 mb-0 tw:text-black!">
                                                    {title}
                                                </Dialog.Title>
                                            )}
                                            {description && (
                                                <Dialog.Description className="small text-muted mt-1">
                                                    {description}
                                                </Dialog.Description>
                                            )}
                                        </div>
                                        {showCloseButton && (
                                            <button
                                                type="button"
                                                className="tw:rounded-lg tw:p-1 tw:text-gray-400"
                                                onClick={onClose}
                                                aria-label="Close"
                                            >
                                                <span className="tw:sr-only">
                                                    Close
                                                </span>
                                                {/* You can add an icon here */}
                                                <VscClose
                                                    size={20}
                                                    className="tw:text-black tw:dark:text-white"
                                                />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Body */}
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Modal footer with actions
interface ModalFooterProps {
    children: ReactNode;
    className?: string;
}

export const ModalFooter = ({
    children,
    className,
}: ModalFooterProps): JSX.Element => {
    return (
        <div
            className={cn(
                'd-flex align-items-center justify-content-end gap-2 mt-3',
                className
            )}
        >
            {children}
        </div>
    );
};
