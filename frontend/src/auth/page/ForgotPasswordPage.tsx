import SwiftFlitzLogo from '@adminAssets/swiftflitz-white-logo.svg?react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/routes';
import { useForgotPassword } from '@/shared/hooks';
import { useForm } from 'react-hook-form';
import type { ForgotPasswordData } from '@/shared/types';
import { forgotPasswordSchema } from '@/shared/libs/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

export const ForgotPasswordPage = () => {
    const forgotMutation = useForgotPassword();
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordData) => {
        forgotMutation.mutate(data, {
            onSuccess: () => setSubmitted(true),
        });
    };

    return (
        <>
            <div className="container">
                <div className="row justify-content-center align-items-center tw:h-screen">
                    <div className="col-sm-6">
                        <div className="p-2">
                            <div className="tw:flex tw:justify-center tw:flex-col">
                                <Link
                                    to={ROUTES.FRONTEND.HOME}
                                    className="tw:mx-auto"
                                >
                                    <SwiftFlitzLogo className="tw:mx-auto tw:h-10 tw:w-auto mb-3" />
                                </Link>
                                <h2 className="tw:mt-10 tw:text-center tw:text-2xl/9 tw:font-bold tw:tracking-tight text-white">
                                    Forgot your password?
                                </h2>
                                <p className="tw:text-center tw:mt-2 text-white tw:text-sm">
                                    Enter your email address and we'll send you
                                    a link to reset your password.
                                </p>
                            </div>

                            <div className="tw:mt-10 tw:sm:mx-auto tw:sm:w-full tw:sm:max-w-sm">
                                {submitted ? (
                                    <div className="tw:text-center">
                                        <div className="tw:text-green-400 tw:text-lg tw:font-semibold tw:mb-3">
                                            Check your email
                                        </div>
                                        <p className="text-white tw:text-sm tw:mb-6">
                                            If an account exists with that email
                                            address, you'll receive a password
                                            reset link shortly.
                                        </p>
                                        <Link
                                            to={ROUTES.AUTH.AUTH_LOGIN}
                                            className="btn tw:bg-primary! tw:text-white! tw:text-md/6 tw:w-full mb-3 tw:hover:opacity-75"
                                        >
                                            Back to Sign In
                                        </Link>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleSubmit(onSubmit)}
                                        className="tw:space-y-6"
                                    >
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
                                                    required
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
                                            <button
                                                type="submit"
                                                disabled={
                                                    isSubmitting ||
                                                    forgotMutation.isPending
                                                }
                                                className="btn tw:bg-primary! tw:text-white! tw:text-md/6 tw:w-full mb-3 tw:hover:opacity-75"
                                            >
                                                {isSubmitting ||
                                                forgotMutation.isPending
                                                    ? 'Sending...'
                                                    : 'Send Reset Link'}
                                            </button>
                                        </div>
                                    </form>
                                )}

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
