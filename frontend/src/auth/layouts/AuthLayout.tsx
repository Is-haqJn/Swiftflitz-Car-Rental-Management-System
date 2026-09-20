import '@adminAssets/css/style.css';
import '@/shared/styles/custom.css';
import SwiftFlitzLogo from '@adminAssets/swiftflitz-white-logo.svg?react';
import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '@/shared/routes/routes';

interface AuthLayoutProps {
    children?: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="auth-layout tw:bg-secondary">
            <div className="container">
                <div className="row justify-content-center align-items-center tw:h-screen">
                    <div className="col-sm-6 ">
                        <div className="p-2">
                            <div className="tw:flex tw:justify-center tw:flex-col">
                                <SwiftFlitzLogo className="tw:mx-auto tw:h-10 tw:w-auto mb-3" />
                                {/*<img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                         alt="Your Company" className="tw:mx-auto tw:h-10 tw:w-auto"/>*/}
                                <h2 className="tw:mt-10 tw:text-center tw:text-2xl/9 tw:font-bold tw:tracking-tight text-white">
                                    Sign In to your account
                                </h2>
                                {children}
                            </div>

                            <div className="tw:mt-10 tw:sm:mx-auto tw:sm:w-full tw:sm:max-w-sm">
                                <form
                                    action="#"
                                    method="POST"
                                    className="tw:space-y-6"
                                >
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="tw:block tw:text-sm/6 tw:font-semibolde text-white"
                                        >
                                            Email address
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoComplete="email"
                                                className="form-control"
                                                placeholder="Enter your email"
                                            />
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
                                                    to="/"
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
                                                name="password"
                                                required
                                                autoComplete="current-password"
                                                className="form-control"
                                                placeholder="Enter your password"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="btn tw:bg-primary! tw:text-white! tw:text-md/6 tw:w-full mb-3 tw:hover:opacity-75"
                                        >
                                            Sign in
                                        </button>
                                    </div>
                                </form>

                                <p className="tw:mt-10 tw:text-center tw:text-sm/6 text-white">
                                    Not a member?{' '}
                                    <Link
                                        to={ROUTES.DASHBOARD}
                                        className="tw:font-semibold text-white hover:tw:opacity-95"
                                    >
                                        Register here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Outlet />
        </div>
    );
};

export default AuthLayout;
