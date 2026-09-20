import React, { forwardRef } from 'react';

import { cn } from '@/shared/libs/utils';
import { VscLoading } from 'react-icons/vsc';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | 'primary'
        | 'secondary'
        | 'outline'
        | 'ghost'
        | 'danger'
        | 'success'
        | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline-primary',
    ghost: 'tw:bg-transparent tw:hover:bg-gray-100 tw:dark:bg-transparent tw:dark:hover:bg-gray-800',
    danger: 'btn-danger',
    success: 'btn-success',
    link: 'btn-link',
};

const sizeStyles = {
    xs: 'btn-sm tw:px-2 tw:py-1 tw:text-xs',
    sm: 'btn-sm',
    md: '', // default Bootstrap button size
    lg: 'btn-lg',
    xl: 'btn-lg tw:px-6 tw:py-3 tw:text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            loadingText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'btn',
                    'tw:inline-flex tw:items-center tw:justify-center tw:gap-2',
                    variantStyles[variant],
                    sizeStyles[size],
                    fullWidth && 'w-100',
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <VscLoading className="tw:h-5 tw:w-5 tw:animate-spin" />
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {leftIcon && (
                            <span className="tw:inline-flex">{leftIcon}</span>
                        )}
                        {children}
                        {rightIcon && (
                            <span className="tw:inline-flex">{rightIcon}</span>
                        )}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
