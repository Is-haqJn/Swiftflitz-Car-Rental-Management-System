import SwiftFlitzLogo from '@adminAssets/swiftflitz-white-logo.svg?react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/routes';
import { useResetPassword } from '@/shared/hooks';
import { useForm } from 'react-hook-form';
import type { ResetPasswordData } from '@/shared/types';
import { resetPasswordSchema } from '@/shared/libs/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { applyServerErrors } from '@/shared/libs/utils';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const email = searchParams.get('email') ?? '';

    const resetMutation = useResetPassword();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token,
            email,
        },
    });

    const onSubmit = async (data: ResetPasswordData) => {
        resetMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (!token) {
        return (
            <div className="container">
                <div className="row justify-content-center align-items-center tw:h-screen">
                    <div className="col-sm-6">
                        <div className="p-2 tw:text-center">
                            <Link
                                to={ROUTES.FRONTEND.HOME}
                                className="tw:mx-auto"
                            >
                                <SwiftFlitzLogo className="tw:mx-auto tw:h-10 tw:w-auto mb-3" />
                            </Link>
                            <p className="text-white tw:mt-6">
                                Invalid or missing reset token. Please request a
                                new password reset link.
                            </p>
                            <Link
                                to={ROUTES.AUTH.FORGOT_PASSWORD}
                                className="btn tw:bg-primary! tw:text-white! tw:text-md/6 tw:w-full mt-4 tw:hover:opacity-75"
                            >
                                Request New Link
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container">
                <div className="row justify-content-center align-items-center tw:h-screen">
                    <div className="col-sm-6">
                        <div className="p-2">
                            <div className="tw:flex tw:justify-center tw:flex-col">
                                <SwiftFlitzLogo className="tw:mx-auto tw:h-10 tw:w-auto mb-3" />
                                <h2 className="tw:mt-10 tw:text-center tw:text-2xl/9 tw:font-bold tw:tracking-tight text-white">
                                    Reset your password
                                </h2>
                                <p className="tw:text-center tw:mt-2 text-white tw:text-sm">
                                    Enter your new password below.
                                </p>
                            </div>

                            <div className="tw:mt-10 tw:sm:mx-auto tw:sm:w-full tw:sm:max-w-sm">
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="tw:space-y-6"
                                >
                                    <input
                                        type="hidden"
                                        {...register('token')}
                                    />

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="tw:block tw:text-sm/6 tw:font-semibold text-white"
                                        >
                                            Email address
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="email"
                                                type="email"
                                                autoComplete="email"
                                                className={`form-control${errors.email ? ' is-invalid' : ''}`}
                                                placeholder="Enter your email"
                                                {...register('email')}
                                            />
                                            {errors.email && (
                                                <p className="tw:text-red-400 tw:text-sm tw:mt-1">
                                                    {errors.email.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="tw:block tw:text-sm/6 tw:font-semibold text-white"
                                        >
                                            New Password
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="password"
                                                type="password"
                                                autoComplete="new-password"
                                                className={`form-control${errors.password ? ' is-invalid' : ''}`}
                                                placeholder="Enter new password"
                                                {...register('password')}
                                            />
                                            {errors.password && (
                                                <p className="tw:text-red-400 tw:text-sm tw:mt-1">
                                                    {errors.password.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="password_confirmation"
                                            className="tw:block tw:text-sm/6 tw:font-semibold text-white"
                                        >
                                            Confirm New Password
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="password_confirmation"
                                                type="password"
                                                autoComplete="new-password"
                                                className={`form-control${errors.password_confirmation ? ' is-invalid' : ''}`}
                                                placeholder="Confirm new password"
                                                {...register(
                                                    'password_confirmation'
                                                )}
                                            />
                                            {errors.password_confirmation && (
                                                <p className="tw:text-red-400 tw:text-sm tw:mt-1">
                                                    {
                                                        errors
                                                            .password_confirmation
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={
                                                isSubmitting ||
                                                resetMutation.isPending
                                            }
                                            className="btn tw:bg-primary! tw:text-white! tw:text-md/6 tw:w-full mb-3 tw:hover:opacity-75"
                                        >
                                            {isSubmitting ||
                                            resetMutation.isPending
                                                ? 'Resetting...'
                                                : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>

                                <p className="tw:mt-6 tw:text-center tw:text-sm/6 text-white">
                                    Remember your password?{' '}
                                    <Link
                                        to={ROUTES.AUTH.AUTH_LOGIN}
                                        className="tw:font-semibold text-white hover:tw:opacity-95"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
