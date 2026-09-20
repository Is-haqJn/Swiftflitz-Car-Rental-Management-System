import SwiftFlitzLogo from '@adminAssets/swiftflitz-white-logo.svg?react';
import { Link } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import { ROUTES } from '@/shared/routes';
import { useLogin } from '@/shared/hooks';
import { useForm } from 'react-hook-form';
import type { LoginCredentials } from '@/shared/types';
import { loginSchema } from '@/shared/libs/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { tokenManager } from '@/shared/config/tokenManager';

export const LoginPage = () => {
    const loginMutation = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginCredentials>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: `${import.meta.env.VITE_DEBUG_MODE === 'true' ? 'admin@ordaq.com' : ''}`,
            password: `${import.meta.env.VITE_DEBUG_MODE === 'true' ? 'password' : ''}`,
            remember: false,
        },
    });

    const onSubmit = async (data: LoginCredentials) => {
        loginMutation.mutate(data);
    };

    return (
        <>
            <div className="container">
                <div className="row justify-content-center align-items-center tw:h-screen">
                    <div className="col-sm-6 ">
                        <div className="p-2">
                            <div className="tw:flex tw:justify-center tw:flex-col">
                                <Link
                                    to={ROUTES.FRONTEND.HOME}
                                    className="tw:mx-auto"
                                >
                                    <SwiftFlitzLogo className="tw:mx-auto tw:h-10 tw:w-auto mb-3" />
                                </Link>
                                {/* <SwiftFlitzLogo className="tw:mx-auto tw:h-10 tw:w-auto mb-3" /> */}
                                {/*<img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                         alt="Your Company" className="tw:mx-auto tw:h-10 tw:w-auto"/>*/}
                                <h2 className="tw:mt-10 tw:text-center tw:text-2xl/9 tw:font-bold tw:tracking-tight text-white">
                                    Sign In to your account
                                </h2>
                                {import.meta.env.VITE_DEBUG_MODE === 'true' && (
                                    <p className="tw:text-center tw:mt-4! tw:text-white">
                                        {tokenManager
                                            .getAuthMode()
                                            .toUpperCase()}{' '}
                                        Authentication Mode
                                    </p>
                                )}
                            </div>

                            <div className="tw:mt-3 tw:sm:mx-auto tw:sm:w-full tw:sm:max-w-sm">
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="tw:space-y-6"
                                >
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="tw:block tw:text-sm/6 tw:font-semibolde text-white"
                                        >
                                            Username or Email address
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="email"
                                                type="text"
                                                required
                                                autoComplete="email"
                                                className="form-control"
                                                placeholder="Enter your username or email"
                                                {...register('email')}
                                            />
                                            {errors.email && (
                                                <p className="tw-text-red-500 tw:text-sm tw:mt-1">
                                                    {errors.email.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="tw:flex tw:items-center tw:justify-between">
                                            <label
                                                htmlFor="password"
                                                className="tw:block tw:text-sm/6 tw:font-semibold text-white"
                                            >
                                                Password
                                            </label>
                                            <div className="tw:text-sm">
                                                <Link
                                                    to={
                                                        ROUTES.AUTH
                                                            .AUTH_FORGOT_PASSWORD
                                                    }
                                                    className="tw:font-semibold tw:text-indigo-600 text-white"
                                                >
                                                    Forgot password?
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <input
                                                id="password"
                                                type="password"
                                                required
                                                autoComplete="current-password"
                                                className="form-control"
                                                placeholder="Enter your password"
                                                {...register('password')}
                                            />
                                            {errors.password && (
                                                <p className="tw-text-red-500 tw:text-sm tw:mt-1">
                                                    {errors.password.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Form.Check
                                        type="switch"
                                        id="remember-switch"
                                        label="Remember me"
                                        className="text-white tw:cursor-pointer mb-3"
                                        {...register('remember')}
                                    />

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn tw:bg-primary! tw:text-white! tw:text-md/6 tw:w-full mb-3 tw:hover:opacity-75"
                                        >
                                            {isSubmitting
                                                ? 'Signing in...'
                                                : 'Sign In'}
                                        </button>
                                    </div>
                                </form>

                                {import.meta.env.VITE_DEBUG_MODE === 'true' && (
                                    <p className="tw:mt-10 tw:text-center tw:text-sm/6 text-white">
                                        Not a member?{' '}
                                        <Link
                                            to={ROUTES.AUTH.REGISTER}
                                            className="tw:font-semibold text-white hover:tw:opacity-95"
                                        >
                                            Register here
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
