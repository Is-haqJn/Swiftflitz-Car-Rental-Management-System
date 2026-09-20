import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { VscWarning } from 'react-icons/vsc';
import { Button } from '@/shared/components/common/Button';

interface confirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger' | 'success';
    icon?: ReactNode;
    closeOnOverlayClick?: boolean;
}

interface ConfirmContextType {
    confirm: (options: confirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<confirmOptions | null>(null);
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
        null
    );

    const confirm = useCallback((options: confirmOptions) => {
        setOptions(options);
        setIsOpen(true);

        return new Promise<boolean>(resolve => {
            setResolver(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        resolver?.(true);
        setIsOpen(false);
        setOptions(null);
        setResolver(null);
    };

    const handleCancel = () => {
        resolver?.(false);
        setIsOpen(false);
        setOptions(null);
        setResolver(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {options && (
                <Modal
                    isOpen={isOpen}
                    onClose={handleCancel}
                    title={options.title}
                    description={options.message}
                    showCloseButton={false}
                    closeOnOverlayClick={options.closeOnOverlayClick}
                >
                    <div className="tw:flex tw:items-center tw:gap-3">
                        {options.icon || (
                            <div
                                className="tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-yellow-100 tw:bg-opacity-25"
                                style={{ width: '48px', height: '48px' }}
                            >
                                <VscWarning
                                    size={24}
                                    className="tw:text-yellow-500"
                                />
                            </div>
                        )}
                        <p className="tw:flex-1 tw:text-gray-600 tw:m-0">
                            {options.message}
                        </p>
                    </div>

                    <ModalFooter className="mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="tw:border-primary tw:text-primary! tw:hover:bg-primary! tw:hover:text-white!"
                            onClick={handleCancel}
                        >
                            {options.cancelText || 'Cancel'}
                        </Button>
                        <Button
                            variant={options.confirmVariant || 'primary'}
                            onClick={handleConfirm}
                            size="sm"
                            autoFocus
                            className="tw:text-white!"
                        >
                            {options.confirmText || 'Confirm'}
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </ConfirmContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = (): ConfirmContextType => {
    const context = useContext(ConfirmContext);
    if (!context)
        throw new Error('useConfirm must be used within a ConfirmProvider');
    return context;
};
