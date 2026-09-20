<?php

namespace App\Enums;

enum TransactionType: string
{
    case Payment = 'payment';
    case Refund = 'refund';
    case CancellationFee = 'cancellation_fee';
    case OverdueCharge = 'overdue_charge';
    case SecurityDeposit = 'security_deposit';
    case DepositRefund = 'deposit_refund';
    case DepositWaived = 'deposit_waived';
    case ManualPayment = 'manual_payment';
    case InitialPayment = 'initial_payment';
    case PartPayment = 'part_payment';
    case FullPayment = 'full_payment';
    case Discount = 'discount';
    case DamageCharge = 'damage_charge';
    case RepairCost = 'repair_cost';
    case ResolveDebt = 'resolve_debt';
    case CancellationRefund = 'cancellation_refund';

    public function label(): string
    {
        return match ($this) {
            self::Payment => 'Payment',
            self::Refund => 'Refund',
            self::CancellationFee => 'Cancellation Fee',
            self::OverdueCharge => 'Overdue Charge',
            self::SecurityDeposit => 'Security Deposit',
            self::DepositRefund => 'Deposit Refund',
            self::DepositWaived => 'Deposit Waived',
            self::ManualPayment => 'Manual Payment',
            self::InitialPayment => 'Initial Payment',
            self::PartPayment => 'Part Payment',
            self::FullPayment => 'Full Payment',
            self::Discount => 'Discount',
            self::DamageCharge => 'Damage Charge',
            self::RepairCost => 'Repair Cost',
            self::ResolveDebt => 'Debt Settlement',
            self::CancellationRefund => 'Cancellation Refund',
        };
    }
}
