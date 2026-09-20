import { Fragment, useEffect, useCallback, useState, useMemo } from 'react';
import {
    Row,
    Col,
    Form,
    Card,
    Button,
    Spinner,
    Badge,
    Alert,
    ListGroup,
    Modal,
} from 'react-bootstrap';
import { Combobox } from '@headlessui/react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, differenceInYears, format, parseISO, subYears } from 'date-fns';
import ReactDatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { ROUTES } from '@/shared/routes';
import { useCreateRental } from '@/shared/hooks/queries/useRentals';
import {
    useVehicles,
    useVehicleBookedDates,
} from '@/shared/hooks/queries/useVehicles';
import { useRentalLocations } from '@/shared/hooks/queries/useRentalLocations';
import { useAdditionalCharges } from '@/shared/hooks/queries/useAdditionalCharges';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { usePricingPreview } from '@/shared/hooks/queries/usePricingPreview';
import {
    useGeneralSettings,
    useRentalSettings,
} from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import HourSelect from '@/admin/components/HourSelect';
import {
    useCreateCustomer,
    useUploadCustomerDocument,
    useRequestReupload,
    useSendCompleteProfileLink,
} from '@/shared/hooks/queries/useCustomers';
import { useTitle } from '@/shared/hooks';
import { applyServerErrors } from '@/shared/libs/utils';
import { selectAuthUser } from '@/store/slices/authSlice';
import DatePickerField from '@/admin/components/DatePickerField';
import { customerService } from '@/services/customerService';
import type { Vehicle } from '@/shared/types/vehicles.types';
import type { AdditionalCharge } from '@/shared/types/additional-charge.types';
import type {
    CreateRentalData,
    RentalSource,
    QuoteRequest,
} from '@/shared/types/rental.types';
import { quoteRequestService } from '@/services/rentalService';
import type {
    PricingBreakdown,
    AddonBreakdownItem,
} from '@/shared/types/pricing.types';
import type { IdType } from '@/shared/types/customer.types';

/* Form types */
interface NewBookingFormData {
    // Rental
    vehicle_id: string;
    source: RentalSource;
    branch_id: string;
    pickup_date: string;
    pickup_time: string;
    return_date: string;
    return_time: string;
    pickup_location_id: string;
    dropoff_location_id: string;
    coupon_code: string;
    manual_discount_amount: string;
    manual_discount_reason: string;
    skip_security_deposit: boolean;
    initial_payment: string;
    collect_deposit_now: boolean;
    customer_notes: string;
    admin_notes: string;
    // Customer
    name: string;
    email: string;
    phone: string;
    alt_phone: string;
    address: string;
    date_of_birth: string;
    license_number: string;
    license_expiry_date: string;
    id_type: IdType | '';
    id_number: string;
    // Age bracket for deposit calculation when DOB is unknown
    young_driver_bracket: 'under' | 'above' | '';
}

const defaultValues: NewBookingFormData = {
    vehicle_id: '',
    source: 'walk_in',
    branch_id: '',
    pickup_date: '',
    pickup_time: '09:00',
    return_date: '',
    return_time: '17:00',
    pickup_location_id: '',
    dropoff_location_id: '',
    coupon_code: '',
    manual_discount_amount: '',
    manual_discount_reason: '',
    skip_security_deposit: false,
    initial_payment: '',
    collect_deposit_now: false,
    customer_notes: '',
    admin_notes: '',
    name: '',
    email: '',
    phone: '',
    alt_phone: '',
    address: '',
    date_of_birth: '',
    license_number: '',
    license_expiry_date: '',
    id_type: '',
    id_number: '',
    young_driver_bracket: '',
};

/* Addon tile */
interface AddonTileProps {
    charge: AdditionalCharge;
    selected: boolean;
    disabled: boolean;
    rentalDays: number;
    currencySymbol: string;
    previewItem?: AddonBreakdownItem;
    exchangeRate?: number | null;
    onToggle: (id: string) => void;
    isGlobalUser?: boolean;
    globalSymbol?: string;
}

function AddonTile({
    charge,
    selected,
    disabled,
    rentalDays,
    currencySymbol,
    previewItem,
    exchangeRate,
    onToggle,
    isGlobalUser,
    globalSymbol,
}: AddonTileProps) {
    const isPerDay = charge.charge_type === 'per_day';
    /* When pricing preview is loaded, use FX-converted amounts from it.
       For unselected global charges (branch_id=null), apply exchange rate as fallback. */
    const rawUnit = charge.amount;
    const effectiveUnit =
        !previewItem && !charge.branch_id && exchangeRate
            ? rawUnit / exchangeRate
            : rawUnit;
    const displayUnit = previewItem ? previewItem.unit : effectiveUnit;
    const displayTotal = previewItem
        ? previewItem.amount
        : isPerDay
          ? effectiveUnit * rentalDays
          : effectiveUnit;
    const displaySymbol = currencySymbol;

    /* Dual display: global admins see branch amount + GHS equivalent side by side. */
    const showDual = !!(isGlobalUser && exchangeRate && !charge.branch_id);
    const gSym = globalSymbol ?? '₵';
    const globalTotal =
        previewItem && exchangeRate
            ? previewItem.amount * exchangeRate
            : isPerDay
              ? rawUnit * rentalDays
              : rawUnit;
    const globalUnit =
        previewItem && exchangeRate ? previewItem.unit * exchangeRate : rawUnit;

    return (
        <div
            onClick={() => !disabled && onToggle(charge.id)}
            style={{
                border: `1.5px solid ${disabled ? '#dee2e6' : selected ? '#0d6efd' : '#dee2e6'}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: disabled
                    ? '#f8f9fa'
                    : selected
                      ? '#f0f6ff'
                      : '#fff',
                opacity: disabled ? 0.55 : 1,
                userSelect: 'none',
                transition: 'border-color 0.15s, background 0.15s',
                height: '100%',
            }}
        >
            <div className="d-flex justify-content-between align-items-start">
                <span
                    className="fw-medium small"
                    style={{ color: disabled ? '#adb5bd' : 'inherit' }}
                >
                    {charge.name}
                </span>
                {selected && !disabled && (
                    <span
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: '#0d6efd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: 6,
                        }}
                    >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path
                                d="M1.5 4.5L3.5 6.5L7.5 2.5"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                )}
            </div>
            <div className="mt-1">
                {isPerDay && rentalDays > 0 ? (
                    <span className="small text-muted">
                        {formatWithSymbol(displayUnit, displaySymbol)}/day ×{' '}
                        {rentalDays} days ={' '}
                        <strong className="text-body">
                            {formatWithSymbol(displayTotal, displaySymbol)}
                            {showDual && (
                                <span className="fw-normal text-muted ms-1">
                                    / {formatWithSymbol(globalTotal, gSym)}
                                </span>
                            )}
                        </strong>
                    </span>
                ) : isPerDay ? (
                    <span className="small text-muted">
                        {formatWithSymbol(displayUnit, displaySymbol)}/day
                        {showDual && (
                            <span className="ms-1">
                                / {formatWithSymbol(globalUnit, gSym)}/day
                            </span>
                        )}
                    </span>
                ) : (
                    <span className="small text-muted">
                        {formatWithSymbol(displayTotal, displaySymbol)}
                        {showDual && (
                            <span className="ms-1">
                                / {formatWithSymbol(globalTotal, gSym)}
                            </span>
                        )}{' '}
                        flat
                    </span>
                )}
            </div>
        </div>
    );
}

/* Main component */
export default function NewBooking() {
    const { data: generalSettings } = useGeneralSettings();
    const { data: rentalSettingsRes } = useRentalSettings();
    const windowStart = rentalSettingsRes?.data?.pickup_window_start
        ? parseInt(rentalSettingsRes.data.pickup_window_start.split(':')[0], 10)
        : 0;
    const windowEnd = rentalSettingsRes?.data?.pickup_window_end
        ? parseInt(rentalSettingsRes.data.pickup_window_end.split(':')[0], 10)
        : 23;
    const returnTimeThreshold =
        rentalSettingsRes?.data?.return_time_threshold ?? null;
    const navigate = useNavigate();
    const location = useLocation();
    const fromQuote =
        (location.state as { fromQuote?: QuoteRequest } | null)?.fromQuote ??
        null;
    const title = useTitle('New Booking');
    const authUser = useSelector(selectAuthUser);

    const hasGlobalBranchAccess = !(authUser?.branches?.length ?? 0);

    /* Mutations */
    const createCustomerMutation = useCreateCustomer();
    const uploadMutation = useUploadCustomerDocument();
    const createRentalMutation = useCreateRental();
    const requestReuploadMutation = useRequestReupload();
    const sendCompleteProfileLinkMutation = useSendCompleteProfileLink();
    const pricingPreview = usePricingPreview();

    /* Local state */
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [customerDetailsMode, setCustomerDetailsMode] = useState<'fill' | 'send_link'>('fill');
    const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
    const [preview, setPreview] = useState<PricingBreakdown | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [showCompletePaymentModal, setShowCompletePaymentModal] =
        useState(false);
    const [completePaymentOption, setCompletePaymentOption] = useState<
        'rental_only' | 'rental_and_deposit'
    >('rental_only');

    // Customer state
    const [existingCustomerId, setExistingCustomerId] = useState<string | null>(
        null
    );
    const [existingCustomerName, setExistingCustomerName] =
        useState<string>('');
    const [debouncedEmail, setDebouncedEmail] = useState('');
    const [docError, setDocError] = useState<string | null>(null);

    // Document upload state
    const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
    const [licensePreviews, setLicensePreviews] = useState<string[]>([]);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string>('');
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [passportPreview, setPassportPreview] = useState<string>('');

    /* Form */
    const {
        register,
        handleSubmit,
        control,
        setError,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewBookingFormData>({ defaultValues });

    /* Pre-fill from quote */
    useEffect(() => {
        if (!fromQuote) return;
        reset({
            ...defaultValues,
            vehicle_id: fromQuote.vehicle_id ?? '',
            pickup_date: fromQuote.pickup_date ?? '',
            return_date: fromQuote.return_date ?? '',
            email: fromQuote.email ?? '',
            name: fromQuote.name ?? '',
            phone: fromQuote.phone ?? '',
            admin_notes: fromQuote.admin_notes ?? '',
            customer_notes: fromQuote.message ?? '',
            source: 'quote_request',
        });
    }, [fromQuote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const watchedVehicleId = useWatch({ control, name: 'vehicle_id' });
    const watchedBranchId = useWatch({ control, name: 'branch_id' });
    const watchedPickupDate = useWatch({ control, name: 'pickup_date' });
    const watchedReturnDate = useWatch({ control, name: 'return_date' });
    const watchedPickupTime = useWatch({ control, name: 'pickup_time' });
    const watchedReturnTime = useWatch({ control, name: 'return_time' });
    const watchedPickupLocationId = useWatch({
        control,
        name: 'pickup_location_id',
    });
    const watchedDropoffLocationId = useWatch({
        control,
        name: 'dropoff_location_id',
    });
    const watchedCoupon = useWatch({ control, name: 'coupon_code' });
    const watchedManualDiscount = useWatch({
        control,
        name: 'manual_discount_amount',
    });
    const watchedSkipDeposit = useWatch({
        control,
        name: 'skip_security_deposit',
    });
    const watchedInitialPayment = useWatch({
        control,
        name: 'initial_payment',
    });
    const watchedEmail = useWatch({ control, name: 'email' });
    const watchedYoungDriverBracket = useWatch({
        control,
        name: 'young_driver_bracket',
    });
    const watchedDob = useWatch({ control, name: 'date_of_birth' });

    /* Data */
    const { data: vehiclesRes } = useVehicles({ per_page: 200 });
    const vehicles = vehiclesRes?.data ?? [];

    const { data: locationsRes } = useRentalLocations({
        'filter[is_active]': '1',
        'filter[branch_id]': watchedBranchId || undefined,
        per_page: 100,
    });
    const locations = locationsRes?.data ?? [];

    const { data: chargesRes } = useAdditionalCharges({
        'filter[is_active]': '1',
        per_page: 100,
    });
    const charges = chargesRes?.data ?? [];

    const { data: branchesRes } = useActiveBranches();
    const branches = branchesRes?.data ?? [];

    /* Vehicle combobox */
    const [vehicleQuery, setVehicleQuery] = useState('');
    const selectedVehicle =
        vehicles.find((v: Vehicle) => v.id === watchedVehicleId) ?? null;
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const vehicleHasCustomCurrency = !!selectedVehicle?.branch?.exchange_rate;
    const branchSymbol = vehicleHasCustomCurrency
        ? (selectedVehicle?.branch?.currency_symbol ?? globalSymbol)
        : globalSymbol;
    const branchExchangeRate = vehicleHasCustomCurrency
        ? (selectedVehicle?.branch?.exchange_rate ?? null)
        : null;
    const fmtBranch = (n: number) => formatWithSymbol(n, branchSymbol);
    const fmtPreviewDual = (branchAmount: number) => {
        if (!hasGlobalBranchAccess || !branchExchangeRate)
            return fmtBranch(branchAmount);
        return `${fmtBranch(branchAmount)} / ${formatWithSymbol(branchAmount * branchExchangeRate, globalSymbol)}`;
    };
    const convertLocationCharge = (
        amount: number,
        locationBranchId: string | null
    ) =>
        !locationBranchId && branchExchangeRate
            ? amount / branchExchangeRate
            : amount;
    const fmtLocationCharge = (
        amount: number,
        locationBranchId: string | null
    ) => {
        const branchStr = fmtBranch(
            convertLocationCharge(amount, locationBranchId)
        );
        if (hasGlobalBranchAccess && !locationBranchId && branchExchangeRate) {
            return `${branchStr} / ${formatWithSymbol(amount, globalSymbol)}`;
        }
        return branchStr;
    };
    /* Only show vehicles for the selected branch; empty list when no branch chosen. */
    const rentableVehicles = watchedBranchId
        ? vehicles.filter(
              (v: Vehicle) =>
                  v.status !== 'maintenance' &&
                  v.status !== 'unavailable' &&
                  v.branch_id === watchedBranchId
          )
        : [];
    const filteredVehicles =
        vehicleQuery === ''
            ? rentableVehicles
            : rentableVehicles.filter((v: Vehicle) =>
                  `${v.name} ${v.license_plate}`
                      .toLowerCase()
                      .includes(vehicleQuery.toLowerCase())
              );

    /* Booked dates */
    const { data: bookedDatesData } = useVehicleBookedDates(
        watchedVehicleId || null
    );
    const excludeIntervals = (bookedDatesData ?? []).map(r => ({
        start: new Date(r.from + 'T00:00:00'),
        end: new Date(r.to + 'T00:00:00'),
    }));

    /* Rental days */
    const rentalDays =
        watchedPickupDate && watchedReturnDate
            ? Math.max(
                  1,
                  differenceInCalendarDays(
                      parseISO(watchedReturnDate),
                      parseISO(watchedPickupDate)
                  )
              )
            : 0;

    /* Add-ons */
    const optionalCharges = charges.filter(
        (c: AdditionalCharge) => c.scope === 'regular'
    );

    const applicableAutoCharges = useMemo(
        () =>
            charges.filter((c: AdditionalCharge) => {
                if (c.scope === 'regular') return false;
                if (!watchedVehicleId) return false;
                if (c.scope === 'global') return true;
                if (c.scope === 'category')
                    return c.category_id === selectedVehicle?.category?.id;
                if (c.scope === 'vehicle')
                    return c.vehicle_id === watchedVehicleId;
                return false;
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [charges, watchedVehicleId, selectedVehicle?.category?.id]
    );

    const toggleAddon = (id: string) =>
        setSelectedAddonIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    // Clear add-ons when vehicle changes
    useEffect(() => {
        setSelectedAddonIds([]);
    }, [watchedVehicleId]);

    /* Email lookup */
    useEffect(() => {
        if (existingCustomerId) return;
        const timer = setTimeout(() => {
            if (watchedEmail && watchedEmail.includes('@')) {
                setDebouncedEmail(watchedEmail);
            } else {
                setDebouncedEmail('');
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [watchedEmail, existingCustomerId]);

    const { data: lookupResult } = useQuery({
        queryKey: ['customer-lookup', debouncedEmail],
        queryFn: async () => {
            const res = await customerService.lookup(debouncedEmail);
            return res.data ?? null;
        },
        enabled: !!debouncedEmail && !existingCustomerId,
        staleTime: 30_000,
    });

    /* Auto-derive age bracket from DOB when DOB is filled in fill mode */
    useEffect(() => {
        const threshold = selectedVehicle?.resolved_young_driver_age_threshold;
        if (!threshold || customerDetailsMode !== 'fill') return;
        if (watchedDob) {
            try {
                const age = differenceInYears(new Date(), parseISO(watchedDob));
                setValue('young_driver_bracket', age < threshold ? 'under' : 'above');
            } catch {
                // invalid/partial date - leave bracket unchanged
            }
        } else {
            setValue('young_driver_bracket', '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedDob, selectedVehicle?.resolved_young_driver_age_threshold]);

    const handleUseExistingCustomer = () => {
        if (!lookupResult) return;
        setExistingCustomerId(lookupResult.id);
        setExistingCustomerName(lookupResult.name);
        setValue('name', lookupResult.name);
        setValue('email', lookupResult.email);
        setValue('phone', lookupResult.phone);
        setDocError(null);

        const threshold = selectedVehicle?.resolved_young_driver_age_threshold;
        if (lookupResult.date_of_birth && threshold != null) {
            const age = differenceInYears(new Date(), parseISO(lookupResult.date_of_birth));
            setValue('young_driver_bracket', age < threshold ? 'under' : 'above');
        } else {
            setValue('young_driver_bracket', '');
        }
    };

    const handleClearExistingCustomer = () => {
        setExistingCustomerId(null);
        setExistingCustomerName('');
        setDebouncedEmail('');
        reset({
            ...watch(),
            name: '',
            email: '',
            phone: '',
            alt_phone: '',
            address: '',
            date_of_birth: '',
            license_number: '',
            license_expiry_date: '',
            id_type: '',
            id_number: '',
            young_driver_bracket: '',
        });
    };

    /* Document handlers */
    const handleLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setLicenseFiles(prev => [...prev, ...files]);
        setLicensePreviews(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    const removeLicenseFile = (index: number) => {
        URL.revokeObjectURL(licensePreviews[index]);
        setLicenseFiles(prev => prev.filter((_, i) => i !== index));
        setLicensePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (idPreview) URL.revokeObjectURL(idPreview);
        setIdFile(file);
        setIdPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const removeIdFile = () => {
        if (idPreview) URL.revokeObjectURL(idPreview);
        setIdFile(null);
        setIdPreview('');
    };

    const handlePassportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (passportPreview) URL.revokeObjectURL(passportPreview);
        setPassportFile(file);
        setPassportPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const removePassportFile = () => {
        if (passportPreview) URL.revokeObjectURL(passportPreview);
        setPassportFile(null);
        setPassportPreview('');
    };

    /* Pricing preview */
    const runPreview = useCallback(() => {
        if (!watchedVehicleId || !watchedPickupDate || !watchedReturnDate) {
            setPreview(null);
            setPreviewError(null);
            return;
        }
        const autoAddonPayload = applicableAutoCharges.map(
            (c: AdditionalCharge) => ({ id: c.id, quantity: 1 })
        );
        const allAddonPayload = [
            ...autoAddonPayload,
            ...selectedAddonIds.map(id => ({ id, quantity: 1 })),
        ];
        pricingPreview.mutate(
            {
                vehicle_id: watchedVehicleId,
                pickup_date: watchedPickupDate,
                return_date: watchedReturnDate,
                branch_id: watchedBranchId || undefined,
                pickup_location_id: watchedPickupLocationId || undefined,
                dropoff_location_id: watchedDropoffLocationId || undefined,
                addons: allAddonPayload.length ? allAddonPayload : undefined,
                coupon_code: watchedCoupon || undefined,
                manual_discount: watchedManualDiscount
                    ? Number(watchedManualDiscount)
                    : undefined,
                skip_deposit: watchedSkipDeposit,
                young_driver:
                    watchedYoungDriverBracket === 'under'
                        ? true
                        : watchedYoungDriverBracket === 'above'
                          ? false
                          : undefined,
            },
            {
                onSuccess: (data: PricingBreakdown) => {
                    setPreview(data);
                    setPreviewError(null);
                },
                onError: () =>
                    setPreviewError(
                        'Could not calculate pricing. Check inputs.'
                    ),
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        watchedVehicleId,
        watchedBranchId,
        watchedPickupDate,
        watchedReturnDate,
        watchedPickupLocationId,
        watchedDropoffLocationId,
        selectedAddonIds,
        watchedCoupon,
        watchedManualDiscount,
        watchedSkipDeposit,
        watchedYoungDriverBracket,
        applicableAutoCharges,
    ]);

    useEffect(() => {
        const timer = setTimeout(runPreview, 600);
        return () => clearTimeout(timer);
    }, [runPreview]);

    /* Clear vehicle selection when branch changes (selected vehicle may not belong to new branch). */
    useEffect(() => {
        if (
            watchedVehicleId &&
            selectedVehicle &&
            watchedBranchId &&
            selectedVehicle.branch_id !== watchedBranchId
        ) {
            setValue('vehicle_id', '');
            setVehicleQuery('');
        }
    }, [watchedBranchId]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Clear location selections when branch changes so stale locations from another branch are not submitted. */
    useEffect(() => {
        setValue('pickup_location_id', '');
        setValue('dropoff_location_id', '');
    }, [watchedBranchId, setValue]);

    /* Enforce return time threshold: clamp return_time when pickup_time or dates change */
    useEffect(() => {
        if (!returnTimeThreshold || !watchedPickupTime || !watchedReturnDate) return;
        if (watchedPickupDate === watchedReturnDate) return;

        const pickupHour = parseInt(watchedPickupTime.split(':')[0], 10);
        const maxReturnHour = pickupHour - returnTimeThreshold;
        const currentReturnHour = parseInt((watchedReturnTime ?? '00:00').split(':')[0], 10);

        if (currentReturnHour > maxReturnHour) {
            setValue('return_time', `${String(maxReturnHour).padStart(2, '0')}:00`);
        }
    }, [watchedPickupTime, watchedPickupDate, watchedReturnDate, watchedReturnTime, returnTimeThreshold, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Build addon preview map for FX-converted tile amounts */
    const addonPreviewMap = useMemo(() => {
        const map = new Map<string, AddonBreakdownItem>();
        preview?.addonBreakdown.forEach(item => map.set(item.id, item));
        return map;
    }, [preview]);

    /* Payment preview */
    const parsedInitialPayment = parseFloat(watchedInitialPayment) || 0;
    const totalCost = preview?.totalAmount ?? 0;
    const paymentStatusPreview =
        parsedInitialPayment <= 0
            ? null
            : parsedInitialPayment >= totalCost
              ? 'paid'
              : 'partial';
    const remainingAfterInitial = Math.max(0, totalCost - parsedInitialPayment);

    /* Submit */
    const onSubmit = async (data: NewBookingFormData) => {
        if (
            selectedVehicle &&
            data.branch_id &&
            selectedVehicle.branch_id !== data.branch_id
        ) {
            toast.error(
                'Selected vehicle does not belong to the chosen branch. Please re-select a vehicle.'
            );
            return;
        }

        setDocError(null);

        let customerId = existingCustomerId;

        if (!customerId) {
            // Validate docs for new customer in fill mode
            if (customerDetailsMode === 'fill' && (licenseFiles.length === 0 || !idFile)) {
                setDocError(
                    "Please upload the driver's license and a valid ID document."
                );
                toast.error('Document upload required for new customers.');
                return;
            }

            // Step 1: Create customer
            try {
                const res = await createCustomerMutation.mutateAsync({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    alt_phone: data.alt_phone || undefined,
                    is_blacklisted: false,
                    ...(customerDetailsMode === 'fill'
                        ? {
                              address: data.address,
                              date_of_birth: data.date_of_birth || undefined,
                              license_number: data.license_number,
                              license_expiry_date: data.license_expiry_date,
                              id_type: data.id_type as IdType,
                              id_number: data.id_number,
                          }
                        : {}),
                });
                customerId = res.data.id;
            } catch {
                return; // mutation's onError already shows toast
            }

            // Step 2: Upload documents (fill mode only, non-fatal)
            if (customerDetailsMode === 'fill') {
                for (const file of licenseFiles) {
                    try {
                        await uploadMutation.mutateAsync({
                            customerId: customerId!,
                            collection: 'license',
                            file,
                        });
                    } catch {
                        toast.error('Failed to upload one or more license files.');
                    }
                }
                if (idFile) {
                    try {
                        await uploadMutation.mutateAsync({
                            customerId: customerId!,
                            collection: 'id_document',
                            file: idFile,
                        });
                    } catch {
                        toast.error('Failed to upload ID document.');
                    }
                }
                if (passportFile) {
                    try {
                        await uploadMutation.mutateAsync({
                            customerId: customerId!,
                            collection: 'passport',
                            file: passportFile,
                        });
                    } catch {
                        toast.error('Failed to upload passport.');
                    }
                }
            }
        }

        // Step 3: Create rental
        /* When real DOB is provided, let the server derive the bracket from it.
           Only send young_driver_override when DOB is absent (bracket-only estimate). */
        const youngDriverOverride =
            (customerDetailsMode === 'fill' && data.date_of_birth)
                ? undefined
                : data.young_driver_bracket === 'under'
                  ? true
                  : data.young_driver_bracket === 'above'
                    ? false
                    : undefined;

        const autoAddonPayload = applicableAutoCharges.map(
            (c: AdditionalCharge) => ({ id: c.id, quantity: 1 })
        );
        const allAddonPayload = [
            ...autoAddonPayload,
            ...selectedAddonIds.map(id => ({ id, quantity: 1 })),
        ];

        const payload: CreateRentalData = {
            vehicle_id: data.vehicle_id,
            customer_id: customerId!,
            branch_id: data.branch_id || null,
            source: data.source,
            pickup_date: data.pickup_date,
            pickup_time: data.pickup_time || undefined,
            return_date: data.return_date,
            return_time: data.return_time || undefined,
            pickup_location_id: data.pickup_location_id || null,
            dropoff_location_id: data.dropoff_location_id || null,
            addons: allAddonPayload.length ? allAddonPayload : undefined,
            coupon_code: data.coupon_code || null,
            manual_discount_amount: data.manual_discount_amount
                ? Number(data.manual_discount_amount)
                : undefined,
            manual_discount_reason: data.manual_discount_reason || null,
            skip_security_deposit: data.skip_security_deposit,
            young_driver_override: youngDriverOverride,
            initial_payment: parseFloat(data.initial_payment) || 0,
            collect_deposit_now: data.collect_deposit_now,
            customer_notes: data.customer_notes || null,
            admin_notes: data.admin_notes || null,
        };

        createRentalMutation.mutate(payload, {
            onSuccess: async res => {
                if (fromQuote) {
                    try {
                        await quoteRequestService.markConverted(
                            fromQuote.id,
                            res.data.id
                        );
                    } catch {
                        // non-fatal - rental created, quote link is best-effort
                    }
                }
                /* Auto-send complete-profile link for new customers in send_link mode */
                if (customerDetailsMode === 'send_link' && !existingCustomerId && customerId) {
                    try {
                        await sendCompleteProfileLinkMutation.mutateAsync(customerId);
                    } catch {
                        // non-fatal - rental created, link send is best-effort
                    }
                }
                navigate(ROUTES.DASHBOARD.RENTALS.VIEW(res.data.id));
            },
            onError: (err: unknown) => applyServerErrors(err, setError),
        });
    };

    const isSaving =
        isSubmitting ||
        createCustomerMutation.isPending ||
        uploadMutation.isPending ||
        createRentalMutation.isPending ||
        requestReuploadMutation.isPending ||
        sendCompleteProfileLinkMutation.isPending;

    const savingLabel = createCustomerMutation.isPending
        ? 'Creating customer…'
        : uploadMutation.isPending
          ? 'Uploading documents…'
          : createRentalMutation.isPending
            ? 'Creating rental…'
            : requestReuploadMutation.isPending
              ? 'Sending document link…'
              : sendCompleteProfileLinkMutation.isPending
                ? 'Sending profile link…'
                : 'Saving…';

    const showBranch = hasGlobalBranchAccess && branches.length > 0;

    return (
        <Fragment>
            {title}

            {fromQuote && (
                <Alert variant="info" className="mb-3 small">
                    Creating rental from quote{' '}
                    <strong>{fromQuote.reference}</strong>. Customer and vehicle
                    details have been pre-filled from the quote.
                </Alert>
            )}

            {!fromQuote && (
                <Alert variant="primary" className="mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                        <Alert.Heading className="h6 mb-0">
                            Before creating a new booking, make sure the
                            following are set up:
                        </Alert.Heading>
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 ms-2 text-primary"
                            style={{ fontSize: '0.8rem', flexShrink: 0 }}
                            onClick={() => setShowInfoPanel(v => !v)}
                        >
                            {showInfoPanel ? 'Hide' : 'Show'}
                        </Button>
                    </div>
                    {showInfoPanel && (
                        <ul
                            className="mb-0 ps-3 mt-2"
                            style={{ fontSize: '0.875rem' }}
                        >
                            <li>
                                <strong>Vehicles</strong> - the vehicle must
                                exist in{' '}
                                <a
                                    href="/management/vehicles"
                                    className="alert-link"
                                >
                                    Self-Drive Fleet
                                </a>{' '}
                                and be marked as available for rent.
                            </li>
                            <li>
                                <strong>Rental Dates</strong> - set the pickup
                                and return dates carefully; extensions can be
                                made later but date conflicts are checked at
                                save time.
                            </li>
                            <li>
                                <strong>Payment</strong> - record an initial
                                payment here or use &ldquo;Settle&rdquo; on the
                                rental detail page after pickup.
                            </li>
                            <li>
                                <strong>Customer</strong> - a new customer
                                profile will be created automatically from the
                                details you provide below.
                            </li>
                        </ul>
                    )}
                </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Row className="g-3 align-items-start">
                    {/* Left Column */}
                    <Col xl={8} lg={7}>
                        {/* Card 1: Rental Details */}
                        <Card className="mb-3">
                            <Card.Header>
                                <Card.Title>Rental Details</Card.Title>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <Row className="g-3">
                                    {showBranch && (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Branch</Form.Label>
                                                <Form.Select
                                                    {...register('branch_id')}
                                                >
                                                    <option value="">
                                                        No Branch
                                                    </option>
                                                    {branches.map(b => (
                                                        <option
                                                            key={b.id}
                                                            value={b.id}
                                                        >
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    )}
                                    <Col md={showBranch ? 6 : 12}>
                                        <Form.Group>
                                            <Form.Label>Source</Form.Label>
                                            <Form.Select
                                                {...register('source')}
                                            >
                                                <option value="walk_in">
                                                    Walk-in
                                                </option>
                                                <option value="phone">
                                                    Phone
                                                </option>
                                                <option value="website">
                                                    Website
                                                </option>
                                                <option value="referral">
                                                    Referral
                                                </option>
                                                <option value="quote_request">
                                                    Quote
                                                </option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>
                                                Vehicle{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Form.Label>
                                            <Controller
                                                name="vehicle_id"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Vehicle is required.',
                                                }}
                                                render={({ field }) => (
                                                    <Combobox
                                                        value={selectedVehicle}
                                                        onChange={(
                                                            v: Vehicle | null
                                                        ) => {
                                                            field.onChange(
                                                                v?.id ?? ''
                                                            );
                                                            setVehicleQuery('');
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                position:
                                                                    'relative',
                                                            }}
                                                        >
                                                            <div className="input-group">
                                                                <Combobox.Input
                                                                    className={`form-control${errors.vehicle_id ? ' is-invalid' : ''}`}
                                                                    displayValue={(
                                                                        v: Vehicle | null
                                                                    ) =>
                                                                        v
                                                                            ? `${v.name} - ${v.license_plate}`
                                                                            : ''
                                                                    }
                                                                    onChange={e =>
                                                                        setVehicleQuery(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Select or type to search…"
                                                                />
                                                                <Combobox.Button
                                                                    className="input-group-text"
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    ▾
                                                                </Combobox.Button>
                                                            </div>
                                                            <Combobox.Options
                                                                style={{
                                                                    position:
                                                                        'absolute',
                                                                    zIndex: 1050,
                                                                    width: '100%',
                                                                    maxHeight: 240,
                                                                    overflowY:
                                                                        'auto',
                                                                    background:
                                                                        '#fff',
                                                                    border: '1px solid #dee2e6',
                                                                    borderRadius: 4,
                                                                    marginTop: 2,
                                                                    padding: 0,
                                                                    listStyle:
                                                                        'none',
                                                                }}
                                                            >
                                                                {filteredVehicles.length ===
                                                                0 ? (
                                                                    <li className="px-3 py-2 text-muted small">
                                                                        {watchedBranchId
                                                                            ? 'No vehicles found.'
                                                                            : 'Select a branch first.'}
                                                                    </li>
                                                                ) : (
                                                                    filteredVehicles.map(
                                                                        (
                                                                            v: Vehicle
                                                                        ) => (
                                                                            <Combobox.Option
                                                                                key={
                                                                                    v.id
                                                                                }
                                                                                value={
                                                                                    v
                                                                                }
                                                                                className={({
                                                                                    active,
                                                                                }: {
                                                                                    active: boolean;
                                                                                }) =>
                                                                                    `px-3 py-2 small ${active ? 'bg-light' : ''}`
                                                                                }
                                                                                style={{
                                                                                    cursor: 'pointer',
                                                                                    listStyle:
                                                                                        'none',
                                                                                }}
                                                                            >
                                                                                <span>
                                                                                    {
                                                                                        v.name
                                                                                    }{' '}
                                                                                    -{' '}
                                                                                    {
                                                                                        v.license_plate
                                                                                    }{' '}
                                                                                    <span className="text-muted">
                                                                                        (
                                                                                        {formatWithSymbol(
                                                                                            v.daily_rate,
                                                                                            v
                                                                                                .branch
                                                                                                ?.currency_symbol ??
                                                                                                generalSettings
                                                                                                    ?.data
                                                                                                    ?.currency_symbol ??
                                                                                                '₵'
                                                                                        )}
                                                                                        /day)
                                                                                    </span>
                                                                                </span>
                                                                                {v.is_booked && (
                                                                                    <Badge
                                                                                        bg="warning"
                                                                                        text="dark"
                                                                                        className="ms-2 small"
                                                                                    >
                                                                                        Has
                                                                                        Booking
                                                                                    </Badge>
                                                                                )}
                                                                            </Combobox.Option>
                                                                        )
                                                                    )
                                                                )}
                                                            </Combobox.Options>
                                                        </div>
                                                    </Combobox>
                                                )}
                                            />
                                            {errors.vehicle_id && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.vehicle_id.message}
                                                </div>
                                            )}
                                            {selectedVehicle?.is_booked && (
                                                <div className="mt-1">
                                                    <Badge
                                                        bg="warning"
                                                        text="dark"
                                                        className="small"
                                                    >
                                                        This vehicle has active
                                                        bookings - check dates
                                                        below
                                                    </Badge>
                                                </div>
                                            )}
                                        </Form.Group>
                                        
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>
                                                Pickup Date{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Form.Label>
                                            <Controller
                                                name="pickup_date"
                                                control={control}
                                                rules={{
                                                    required: 'Required.',
                                                }}
                                                render={({ field }) => (
                                                    <DatePickerField
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        isInvalid={
                                                            !!errors.pickup_date
                                                        }
                                                        excludeDateIntervals={
                                                            excludeIntervals
                                                        }
                                                        minDate={new Date()}
                                                    />
                                                )}
                                            />
                                            {errors.pickup_date && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.pickup_date.message}
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Pickup Time</Form.Label>
                                            <Controller
                                                name="pickup_time"
                                                control={control}
                                                render={({ field }) => (
                                                    <HourSelect
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        minHour={windowStart}
                                                        maxHour={windowEnd}
                                                        isInvalid={
                                                            !!errors.pickup_time
                                                        }
                                                    />
                                                )}
                                            />
                                            {errors.pickup_time && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.pickup_time.message}
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>
                                                Return Date{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Form.Label>
                                            <Controller
                                                name="return_date"
                                                control={control}
                                                rules={{
                                                    required: 'Required.',
                                                }}
                                                render={({ field }) => (
                                                    <DatePickerField
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        isInvalid={
                                                            !!errors.return_date
                                                        }
                                                        excludeDateIntervals={
                                                            excludeIntervals
                                                        }
                                                        minDate={
                                                            watchedPickupDate
                                                                ? parseISO(
                                                                      watchedPickupDate
                                                                  )
                                                                : new Date()
                                                        }
                                                    />
                                                )}
                                            />
                                            {errors.return_date && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.return_date.message}
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Return Time</Form.Label>
                                            {(() => {
                                                const isSameDay =
                                                    watchedPickupDate &&
                                                    watchedReturnDate &&
                                                    watchedPickupDate ===
                                                        watchedReturnDate;
                                                const pickupHour = watchedPickupTime
                                                    ? parseInt(watchedPickupTime.split(':')[0], 10)
                                                    : null;
                                                const maxReturnHour =
                                                    returnTimeThreshold &&
                                                    !isSameDay &&
                                                    pickupHour !== null
                                                        ? pickupHour - returnTimeThreshold
                                                        : windowEnd;
                                                const isLocked =
                                                    !!returnTimeThreshold &&
                                                    !isSameDay &&
                                                    pickupHour !== null &&
                                                    maxReturnHour <= windowStart;

                                                if (isLocked) {
                                                    return (
                                                        <Form.Control
                                                            type="text"
                                                            value={`${String(maxReturnHour).padStart(2, '0')}:00`}
                                                            readOnly
                                                            disabled
                                                        />
                                                    );
                                                }

                                                return (
                                                    <Controller
                                                        name="return_time"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <HourSelect
                                                                value={field.value ?? ''}
                                                                onChange={field.onChange}
                                                                minHour={windowStart}
                                                                maxHour={maxReturnHour}
                                                                isInvalid={!!errors.return_time}
                                                            />
                                                        )}
                                                    />
                                                );
                                            })()}
                                            {errors.return_time && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.return_time.message}
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={showBranch ? 6 : 12}>
                                        <Form.Group>
                                            <Form.Label>Source</Form.Label>
                                            <Form.Select
                                                {...register('source')}
                                            >
                                                <option value="walk_in">
                                                    Walk-in
                                                </option>
                                                <option value="phone">
                                                    Phone
                                                </option>
                                                <option value="website">
                                                    Website
                                                </option>
                                                <option value="referral">
                                                    Referral
                                                </option>
                                                <option value="quote_request">
                                                    Quote
                                                </option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Card 2: Customer */}
                        <Card className="mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <Card.Title className="mb-0">Customer Details</Card.Title>
                                {!existingCustomerId && !fromQuote && (
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${customerDetailsMode === 'fill' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setCustomerDetailsMode('fill')}
                                        >
                                            Fill Details
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${customerDetailsMode === 'send_link' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setCustomerDetailsMode('send_link')}
                                        >
                                            Send Doc Link
                                        </button>
                                    </div>
                                )}
                            </Card.Header>
                            <Card.Body className="p-3">
                                {existingCustomerId ? (
                                    <Alert
                                        variant="info"
                                        className="d-flex align-items-center justify-content-between mb-0 py-2"
                                    >
                                        <span className="small">
                                            <strong>
                                                Using existing customer:
                                            </strong>{' '}
                                            {existingCustomerName}
                                        </span>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            type="button"
                                            onClick={
                                                handleClearExistingCustomer
                                            }
                                        >
                                            Clear
                                        </Button>
                                    </Alert>
                                ) : (
                                    <Row className="g-3">
                                        {/* Always-visible core fields */}
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Email Address{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    placeholder="customer@example.com"
                                                    {...register('email', {
                                                        required:
                                                            'Email is required.',
                                                    })}
                                                    isInvalid={!!errors.email}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.email?.message}
                                                </Form.Control.Feedback>
                                                {lookupResult &&
                                                    !existingCustomerId && (
                                                        <Alert
                                                            variant="success"
                                                            className="mt-2 py-2 d-flex align-items-center justify-content-between"
                                                        >
                                                            <span className="small">
                                                                Customer found:{' '}
                                                                <strong>
                                                                    {
                                                                        lookupResult.name
                                                                    }
                                                                </strong>{' '}
                                                                -{' '}
                                                                {
                                                                    lookupResult.phone
                                                                }
                                                            </span>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                type="button"
                                                                onClick={
                                                                    handleUseExistingCustomer
                                                                }
                                                            >
                                                                Use this
                                                                customer
                                                            </Button>
                                                        </Alert>
                                                    )}
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Full Name{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="Full name"
                                                    {...register('name', {
                                                        required:
                                                            'Name is required.',
                                                    })}
                                                    isInvalid={!!errors.name}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.name?.message}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Phone Number{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="+233 XX XXX XXXX"
                                                    {...register('phone', {
                                                        required:
                                                            'Phone is required.',
                                                    })}
                                                    isInvalid={!!errors.phone}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.phone?.message}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Alternate Phone
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="+233 XX XXX XXXX"
                                                    {...register('alt_phone')}
                                                />
                                            </Form.Group>
                                        </Col>

                                        {/* Age bracket radio - shown when vehicle has threshold, deposit not waived, and DOB is unknown */}
                                        {selectedVehicle?.resolved_young_driver_age_threshold != null &&
                                            !watchedSkipDeposit &&
                                            !(customerDetailsMode === 'fill' && watchedDob) && (
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="small">
                                                            Customer Age Bracket{' '}
                                                            <span className="text-muted">
                                                                (deposit)
                                                            </span>
                                                        </Form.Label>
                                                        <div className="d-flex flex-column gap-1 mt-1">
                                                            <Form.Check
                                                                type="radio"
                                                                id="bracket_under"
                                                                label={`Under ${selectedVehicle.resolved_young_driver_age_threshold} yrs`}
                                                                value="under"
                                                                {...register('young_driver_bracket')}
                                                            />
                                                            <Form.Check
                                                                type="radio"
                                                                id="bracket_above"
                                                                label={`${selectedVehicle.resolved_young_driver_age_threshold}+ yrs`}
                                                                value="above"
                                                                {...register('young_driver_bracket')}
                                                            />
                                                            <Form.Check
                                                                type="radio"
                                                                id="bracket_unknown"
                                                                label="Not specified"
                                                                value=""
                                                                {...register('young_driver_bracket')}
                                                            />
                                                        </div>
                                                        <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {watchedYoungDriverBracket === 'under'
                                                                ? 'Young driver deposit will apply.'
                                                                : watchedYoungDriverBracket === 'above'
                                                                  ? 'Standard deposit applies.'
                                                                  : 'Standard deposit assumed until DOB confirmed.'}
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            )}

                                        {/* Expanded fields - fill mode only */}
                                        {customerDetailsMode === 'fill' && (
                                            <>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            Date of Birth
                                                        </Form.Label>
                                                        <Controller
                                                            name="date_of_birth"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <div className="d-flex gap-2 align-items-center">
                                                                    <ReactDatePicker
                                                                        selected={
                                                                            field.value
                                                                                ? new Date(field.value)
                                                                                : null
                                                                        }
                                                                        onChange={(d: Date | null) =>
                                                                            field.onChange(
                                                                                d ? format(d, 'yyyy-MM-dd') : ''
                                                                            )
                                                                        }
                                                                        showYearDropdown
                                                                        dropdownMode="select"
                                                                        maxDate={subYears(new Date(), 18)}
                                                                        placeholderText="Date of birth (DD/MM/YYYY)"
                                                                        dateFormat="dd/MM/yyyy"
                                                                        className="form-control"
                                                                        showPopperArrow={false}
                                                                        autoComplete="off"
                                                                    />
                                                                    {field.value && (
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            size="sm"
                                                                            onClick={() => field.onChange('')}
                                                                            title="Clear date of birth"
                                                                            style={{ flexShrink: 0 }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            Address{' '}
                                                            <span className="text-danger">*</span>
                                                        </Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            placeholder="Residential address"
                                                            {...register('address', {
                                                                required: 'Address is required.',
                                                            })}
                                                            isInvalid={!!errors.address}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.address?.message}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </>
                                        )}

                                        {/* Send link info panel */}
                                        {customerDetailsMode === 'send_link' && (
                                            <Col md={12}>
                                                <Alert variant="info" className="small mb-0 py-2">
                                                    <strong>Document request link</strong> will be emailed to the customer after the booking is created. They will fill in their address, ID, license details, and upload documents themselves.
                                                </Alert>
                                            </Col>
                                        )}
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Card 3: License & Identification */}
                        {!existingCustomerId && customerDetailsMode === 'fill' && (
                            <Card className="mb-3">
                                <Card.Header>
                                    <Card.Title>
                                        License &amp; Identification
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    License Number{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="License number"
                                                    {...register(
                                                        'license_number',
                                                        {
                                                            required:
                                                                'License number is required.',
                                                        }
                                                    )}
                                                    isInvalid={
                                                        !!errors.license_number
                                                    }
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {
                                                        errors.license_number
                                                            ?.message
                                                    }
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    License Expiry Date{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Controller
                                                    name="license_expiry_date"
                                                    control={control}
                                                    rules={{
                                                        required:
                                                            'License expiry is required.',
                                                    }}
                                                    render={({ field }) => (
                                                        <DatePickerField
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                            isInvalid={
                                                                !!errors.license_expiry_date
                                                            }
                                                            minDate={new Date()}
                                                            placeholder="Select expiry date"
                                                        />
                                                    )}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {
                                                        errors
                                                            .license_expiry_date
                                                            ?.message
                                                    }
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    ID Type{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Form.Select
                                                    {...register('id_type', {
                                                        required:
                                                            'ID type is required.',
                                                    })}
                                                    isInvalid={!!errors.id_type}
                                                >
                                                    <option value="">
                                                        Select ID type…
                                                    </option>
                                                    <option value="ghana_card">
                                                        Ghana Card
                                                    </option>
                                                    <option value="passport">
                                                        Passport
                                                    </option>
                                                    <option value="voter_id">
                                                        Voter ID
                                                    </option>
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.id_type?.message}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>
                                                    ID Number{' '}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="ID number"
                                                    {...register('id_number', {
                                                        required:
                                                            'ID number is required.',
                                                    })}
                                                    isInvalid={
                                                        !!errors.id_number
                                                    }
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.id_number?.message}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Card 4: Upload Documents */}
                        {!existingCustomerId && customerDetailsMode === 'fill' && (
                            <Card className="mb-3">
                                <Card.Header>
                                    <Card.Title>Upload Documents</Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    {docError && (
                                        <Alert
                                            variant="danger"
                                            className="small py-2 mb-3"
                                        >
                                            {docError}
                                        </Alert>
                                    )}

                                    {/* Driver's License */}
                                    <p className="small fw-medium mb-2">
                                        Driver's License{' '}
                                        <span className="text-danger">*</span>
                                    </p>
                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                        {licensePreviews.map((src, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    position: 'relative',
                                                    width: 72,
                                                    height: 72,
                                                }}
                                            >
                                                <img
                                                    src={src}
                                                    alt={`License ${i + 1}`}
                                                    style={{
                                                        width: 72,
                                                        height: 72,
                                                        objectFit: 'cover',
                                                        borderRadius: 6,
                                                        border: '1px solid #dee2e6',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeLicenseFile(i)
                                                    }
                                                    style={{
                                                        position: 'absolute',
                                                        top: -6,
                                                        right: -6,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        background: '#dc3545',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        lineHeight: 1,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <label
                                            style={{
                                                width: 72,
                                                height: 72,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                border: '1.5px dashed #adb5bd',
                                                background: '#f8f9fa',
                                                color: '#6c757d',
                                                fontSize: 24,
                                            }}
                                        >
                                            +
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleLicenseSelect}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-muted small mb-3">
                                        JPEG, PNG, or WebP. Max 5 MB per file.
                                    </p>

                                    <hr className="my-3" />

                                    {/* Valid ID */}
                                    <p className="small fw-medium mb-2">
                                        Valid ID Document{' '}
                                        <span className="text-danger">*</span>
                                    </p>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        {idPreview && (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    width: 72,
                                                    height: 72,
                                                }}
                                            >
                                                <img
                                                    src={idPreview}
                                                    alt="ID"
                                                    style={{
                                                        width: 72,
                                                        height: 72,
                                                        objectFit: 'cover',
                                                        borderRadius: 6,
                                                        border: '1px solid #dee2e6',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeIdFile}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -6,
                                                        right: -6,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        background: '#dc3545',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        lineHeight: 1,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                        {!idPreview && (
                                            <label
                                                style={{
                                                    width: 72,
                                                    height: 72,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    border: '1.5px dashed #adb5bd',
                                                    background: '#f8f9fa',
                                                    color: '#6c757d',
                                                    fontSize: 24,
                                                }}
                                            >
                                                +
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    style={{ display: 'none' }}
                                                    onChange={handleIdSelect}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-0">
                                        JPEG, PNG, or WebP. Max 5 MB.
                                    </p>

                                    <hr className="my-3" />

                                    {/* Passport */}
                                    <p className="small fw-medium mb-2">
                                        Passport{' '}
                                        <span className="text-muted">
                                            (optional)
                                        </span>
                                    </p>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        {passportPreview && (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    width: 72,
                                                    height: 72,
                                                }}
                                            >
                                                <img
                                                    src={passportPreview}
                                                    alt="Passport"
                                                    style={{
                                                        width: 72,
                                                        height: 72,
                                                        objectFit: 'cover',
                                                        borderRadius: 6,
                                                        border: '1px solid #dee2e6',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removePassportFile}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -6,
                                                        right: -6,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        background: '#dc3545',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        lineHeight: 1,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                        {!passportPreview && (
                                            <label
                                                style={{
                                                    width: 72,
                                                    height: 72,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    border: '1.5px dashed #adb5bd',
                                                    background: '#f8f9fa',
                                                    color: '#6c757d',
                                                    fontSize: 24,
                                                }}
                                            >
                                                +
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    style={{ display: 'none' }}
                                                    onChange={
                                                        handlePassportSelect
                                                    }
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-0">
                                        JPEG, PNG, WebP, or PDF. Max 5 MB.
                                    </p>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Card 5: Location */}
                        <Card className="mb-3">
                            <Card.Header>
                                <Card.Title>Location</Card.Title>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Pickup Location
                                            </Form.Label>
                                            <Form.Select
                                                {...register(
                                                    'pickup_location_id'
                                                )}
                                            >
                                                <option value="">None</option>
                                                {locations
                                                    .filter(l => l.is_pickup)
                                                    .map(l => (
                                                        <option
                                                            key={l.id}
                                                            value={l.id}
                                                        >
                                                            {l.name}
                                                            {l.pickup_charge
                                                                ? ` (+${fmtLocationCharge(l.pickup_charge, l.branch_id)})`
                                                                : ''}
                                                        </option>
                                                    ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Dropoff Location
                                            </Form.Label>
                                            <Form.Select
                                                {...register(
                                                    'dropoff_location_id'
                                                )}
                                            >
                                                <option value="">None</option>
                                                {locations
                                                    .filter(l => l.is_dropoff)
                                                    .map(l => (
                                                        <option
                                                            key={l.id}
                                                            value={l.id}
                                                        >
                                                            {l.name}
                                                            {l.dropoff_charge
                                                                ? ` (+${fmtLocationCharge(l.dropoff_charge, l.branch_id)})`
                                                                : ''}
                                                        </option>
                                                    ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Card 6: Add-ons */}
                        <Card className="mb-3">
                            <Card.Header>
                                <Card.Title>Add-ons</Card.Title>
                            </Card.Header>
                            <Card.Body className="p-3">
                                {applicableAutoCharges.length > 0 && (
                                    <>
                                        <p className="small text-muted mb-2 fw-medium">
                                            Auto-applied
                                        </p>
                                        <Row className="g-2">
                                            {applicableAutoCharges.map(
                                                (c: AdditionalCharge) => (
                                                    <Col
                                                        key={c.id}
                                                        xs={6}
                                                        md={4}
                                                    >
                                                        <div
                                                            style={{
                                                                pointerEvents:
                                                                    'none',
                                                            }}
                                                        >
                                                            <AddonTile
                                                                charge={c}
                                                                selected={true}
                                                                disabled={false}
                                                                rentalDays={
                                                                    rentalDays
                                                                }
                                                                currencySymbol={
                                                                    branchSymbol
                                                                }
                                                                previewItem={addonPreviewMap.get(
                                                                    c.id
                                                                )}
                                                                exchangeRate={
                                                                    branchExchangeRate
                                                                }
                                                                onToggle={() => {}}
                                                                isGlobalUser={
                                                                    hasGlobalBranchAccess
                                                                }
                                                                globalSymbol={
                                                                    globalSymbol
                                                                }
                                                            />
                                                        </div>
                                                    </Col>
                                                )
                                            )}
                                        </Row>
                                        {optionalCharges.length > 0 && (
                                            <hr className="my-3" />
                                        )}
                                    </>
                                )}
                                {optionalCharges.length === 0 &&
                                applicableAutoCharges.length === 0 ? (
                                    <p className="text-muted small mb-0">
                                        No optional add-ons available.
                                    </p>
                                ) : optionalCharges.length > 0 ? (
                                    <Row className="g-2">
                                        {optionalCharges.map(
                                            (c: AdditionalCharge) => (
                                                <Col key={c.id} xs={6} md={4}>
                                                    <AddonTile
                                                        charge={c}
                                                        selected={selectedAddonIds.includes(
                                                            c.id
                                                        )}
                                                        disabled={false}
                                                        rentalDays={rentalDays}
                                                        currencySymbol={
                                                            branchSymbol
                                                        }
                                                        previewItem={addonPreviewMap.get(
                                                            c.id
                                                        )}
                                                        exchangeRate={
                                                            branchExchangeRate
                                                        }
                                                        onToggle={toggleAddon}
                                                        isGlobalUser={
                                                            hasGlobalBranchAccess
                                                        }
                                                        globalSymbol={
                                                            globalSymbol
                                                        }
                                                    />
                                                </Col>
                                            )
                                        )}
                                    </Row>
                                ) : null}
                            </Card.Body>
                        </Card>

                        {/* Card 7: Discounts & Notes */}
                        <Card className="mb-3">
                            <Card.Header>
                                <Card.Title>Discounts &amp; Notes</Card.Title>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <Row className="g-3">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Coupon Code</Form.Label>
                                            <Form.Control
                                                placeholder="e.g. SF12345"
                                                {...register('coupon_code')}
                                                isInvalid={!!errors.coupon_code}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.coupon_code?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>
                                                Manual Discount
                                            </Form.Label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    {branchSymbol}
                                                </span>
                                                <Form.Control
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    placeholder="0.00"
                                                    {...register(
                                                        'manual_discount_amount'
                                                    )}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>
                                                Discount Reason
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="Reason…"
                                                {...register(
                                                    'manual_discount_reason'
                                                )}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Check
                                            type="switch"
                                            id="skip_security_deposit"
                                            label="Waive security deposit"
                                            {...register(
                                                'skip_security_deposit'
                                            )}
                                        />
                                    </Col>
                                </Row>

                                <hr className="my-3" />

                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Customer Notes
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Visible to customer…"
                                                {...register('customer_notes')}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Admin Notes</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Internal only…"
                                                {...register('admin_notes')}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column */}
                    <Col xl={4} lg={5}>
                        <div style={{ position: 'sticky', top: '1rem' }}>
                            {/* Pricing Preview */}
                            <Card>
                                <Card.Header>
                                    <Card.Title className="mb-0">
                                        Pricing Preview
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    {!watchedVehicleId ||
                                    !watchedPickupDate ||
                                    !watchedReturnDate ? (
                                        <p className="text-muted small mb-0">
                                            Select a vehicle and dates to see
                                            pricing.
                                        </p>
                                    ) : pricingPreview.isPending ? (
                                        <div className="text-center py-3">
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                            />
                                            <div className="text-muted small mt-1">
                                                Calculating…
                                            </div>
                                        </div>
                                    ) : previewError ? (
                                        <Alert
                                            variant="warning"
                                            className="small mb-0 py-2"
                                        >
                                            {previewError}
                                        </Alert>
                                    ) : preview ? (
                                        <>
                                            <ListGroup
                                                variant="flush"
                                                className="small"
                                            >
                                                <ListGroup.Item className="d-flex justify-content-between px-0 py-1">
                                                    <span className="text-muted">
                                                        {preview.rentalDays}d ×{' '}
                                                        {fmtPreviewDual(
                                                            preview.dailyRate
                                                        )}
                                                    </span>
                                                    <span>
                                                        {fmtPreviewDual(
                                                            preview.base
                                                        )}
                                                    </span>
                                                </ListGroup.Item>

                                                {preview.addonBreakdown.map(
                                                    item => (
                                                        <ListGroup.Item
                                                            key={item.id}
                                                            className="d-flex justify-content-between px-0 py-1"
                                                        >
                                                            <span className="text-muted">
                                                                {item.name}
                                                                {item.type ===
                                                                    'per_day' &&
                                                                item.days > 1
                                                                    ? ` ×${item.days}d`
                                                                    : ''}
                                                            </span>
                                                            <span>
                                                                {fmtPreviewDual(
                                                                    item.amount
                                                                )}
                                                            </span>
                                                        </ListGroup.Item>
                                                    )
                                                )}

                                                {preview.locationBreakdown.map(
                                                    loc => (
                                                        <ListGroup.Item
                                                            key={loc.type}
                                                            className="d-flex justify-content-between px-0 py-1"
                                                        >
                                                            <span className="text-muted">
                                                                {loc.type ===
                                                                'pickup'
                                                                    ? 'Pickup location'
                                                                    : 'Dropoff location'}
                                                            </span>
                                                            <span>
                                                                {fmtPreviewDual(
                                                                    loc.amount
                                                                )}
                                                            </span>
                                                        </ListGroup.Item>
                                                    )
                                                )}

                                                {(preview.addonTotal > 0 ||
                                                    preview.locationTotal > 0 ||
                                                    preview.totalDiscountAmount >
                                                        0) && (
                                                    <ListGroup.Item className="d-flex justify-content-between px-0 py-1 fw-semibold border-top mt-1 text-muted">
                                                        <span>Subtotal</span>
                                                        <span>
                                                            {fmtPreviewDual(
                                                                preview.subtotal
                                                            )}
                                                        </span>
                                                    </ListGroup.Item>
                                                )}

                                                {preview.totalDiscountAmount >
                                                    0 && (
                                                    <ListGroup.Item className="d-flex justify-content-between px-0 py-1 text-success">
                                                        <span>Discount</span>
                                                        <span>
                                                            −
                                                            {fmtPreviewDual(
                                                                preview.totalDiscountAmount
                                                            )}
                                                        </span>
                                                    </ListGroup.Item>
                                                )}

                                                {preview.taxAmount > 0 && (
                                                    <ListGroup.Item className="d-flex justify-content-between px-0 py-1">
                                                        <span className="text-muted">
                                                            VAT
                                                        </span>
                                                        <span>
                                                            {fmtPreviewDual(
                                                                preview.taxAmount
                                                            )}
                                                        </span>
                                                    </ListGroup.Item>
                                                )}

                                                <ListGroup.Item className="d-flex justify-content-between px-0 py-2 fw-semibold border-top mt-1">
                                                    <span>Total</span>
                                                    <span className="text-primary">
                                                        {fmtPreviewDual(
                                                            preview.totalAmount
                                                        )}
                                                    </span>
                                                </ListGroup.Item>

                                                {preview.depositAmount > 0 && (
                                                    <>
                                                        <ListGroup.Item className="d-flex justify-content-between px-0 py-1 border-top mt-1">
                                                            <span className="text-muted">
                                                                Security Deposit
                                                            </span>
                                                            <span>
                                                                {fmtPreviewDual(
                                                                    preview.depositAmount
                                                                )}
                                                            </span>
                                                        </ListGroup.Item>
                                                        {selectedVehicle?.resolved_young_driver_age_threshold != null && (
                                                            <ListGroup.Item className="px-0 py-1">
                                                                <Badge
                                                                    bg={
                                                                        watchedYoungDriverBracket === 'under'
                                                                            ? 'warning'
                                                                            : watchedYoungDriverBracket === 'above'
                                                                              ? 'success'
                                                                              : 'secondary'
                                                                    }
                                                                    text={watchedYoungDriverBracket === 'under' ? 'dark' : undefined}
                                                                    className="small"
                                                                >
                                                                    {watchedYoungDriverBracket === 'under'
                                                                        ? (watchedDob ? 'Young driver rate (confirmed)' : 'Young driver rate (estimated)')
                                                                        : watchedYoungDriverBracket === 'above'
                                                                          ? 'Standard rate confirmed'
                                                                          : 'Deposit estimated - age not set'}
                                                                </Badge>
                                                            </ListGroup.Item>
                                                        )}
                                                    </>
                                                )}
                                            </ListGroup>

                                            {preview.couponDiscountAmount >
                                                0 && (
                                                <Badge
                                                    bg="success"
                                                    className="mt-2 w-100 py-1 text-wrap"
                                                >
                                                    Coupon: −
                                                    {fmtPreviewDual(
                                                        preview.couponDiscountAmount
                                                    )}
                                                </Badge>
                                            )}
                                        </>
                                    ) : null}
                                </Card.Body>
                            </Card>

                            {/* Payment at Booking */}
                            <Card className="mt-3">
                                <Card.Header>
                                    <Card.Title>Payment at Booking</Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Initial Payment
                                                </Form.Label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        {branchSymbol}
                                                    </span>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        placeholder="0.00"
                                                        {...register(
                                                            'initial_payment'
                                                        )}
                                                        isInvalid={
                                                            !!errors.initial_payment
                                                        }
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors
                                                                .initial_payment
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </div>
                                                {paymentStatusPreview ===
                                                    'paid' && (
                                                    <div className="mt-1 small text-success fw-medium">
                                                        Full payment collected
                                                    </div>
                                                )}
                                                {paymentStatusPreview ===
                                                    'partial' &&
                                                    totalCost > 0 && (
                                                        <div className="mt-1 small text-warning fw-medium">
                                                            Partial payment -{' '}
                                                            {fmtBranch(
                                                                remainingAfterInitial
                                                            )}{' '}
                                                            remaining
                                                        </div>
                                                    )}
                                                {totalCost > 0 &&
                                                    paymentStatusPreview !==
                                                        'paid' && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="p-0 mt-1 small d-block"
                                                            type="button"
                                                            onClick={() =>
                                                                setShowCompletePaymentModal(
                                                                    true
                                                                )
                                                            }
                                                        >
                                                            Mark as fully paid
                                                        </Button>
                                                    )}
                                            </Form.Group>
                                        </Col>

                                        {preview &&
                                            preview.depositAmount > 0 &&
                                            !watchedSkipDeposit && (
                                                <Col md={12}>
                                                    <hr className="my-2" />
                                                    <Form.Check
                                                        type="switch"
                                                        id="collect_deposit_now"
                                                        label={`Security deposit received (${fmtBranch(preview.depositAmount)})`}
                                                        {...register(
                                                            'collect_deposit_now'
                                                        )}
                                                    />
                                                    <Form.Text className="text-muted small d-block mt-1">
                                                        Confirms that the full
                                                        security deposit has
                                                        been physically
                                                        collected at booking.
                                                    </Form.Text>
                                                </Col>
                                            )}
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Form Actions */}
                            <div className="d-flex justify-content-end gap-2 mt-3">
                                <Button
                                    type="button"
                                    variant="light"
                                    onClick={() =>
                                        navigate(ROUTES.DASHBOARD.RENTALS.ROOT)
                                    }
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                                className="me-1"
                                            />
                                            {savingLabel}
                                        </>
                                    ) : (
                                        'Create Booking'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Form>

            {/* Mark as Fully Paid Modal */}
            <Modal
                show={showCompletePaymentModal}
                onHide={() => setShowCompletePaymentModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Mark as Fully Paid</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="small text-muted mb-3">
                        Select what this full payment covers:
                    </p>
                    <Form.Check
                        type="radio"
                        id="complete_rental_only"
                        name="completePaymentOption"
                        label={
                            <>
                                Rental payment only{' '}
                                <span className="text-muted">
                                    ({fmtBranch(totalCost)})
                                </span>
                            </>
                        }
                        checked={completePaymentOption === 'rental_only'}
                        onChange={() => setCompletePaymentOption('rental_only')}
                        className="mb-2"
                    />
                    {preview &&
                        preview.depositAmount > 0 &&
                        !watchedSkipDeposit && (
                            <Form.Check
                                type="radio"
                                id="complete_rental_and_deposit"
                                name="completePaymentOption"
                                label={
                                    <>
                                        Rental payment + security deposit{' '}
                                        <span className="text-muted">
                                            ({fmtBranch(totalCost)} +{' '}
                                            {fmtBranch(preview.depositAmount)}{' '}
                                            deposit)
                                        </span>
                                    </>
                                }
                                checked={
                                    completePaymentOption ===
                                    'rental_and_deposit'
                                }
                                onChange={() =>
                                    setCompletePaymentOption(
                                        'rental_and_deposit'
                                    )
                                }
                            />
                        )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => {
                            setShowCompletePaymentModal(false);
                            setCompletePaymentOption('rental_only');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            const amount =
                                completePaymentOption ===
                                    'rental_and_deposit' && preview
                                    ? totalCost + preview.depositAmount
                                    : totalCost;
                            setValue('initial_payment', amount.toFixed(2));
                            if (
                                completePaymentOption === 'rental_and_deposit'
                            ) {
                                setValue('collect_deposit_now', true);
                            }
                            setShowCompletePaymentModal(false);
                        }}
                    >
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
}
