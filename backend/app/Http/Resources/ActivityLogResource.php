<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;
use Throwable;

/** @mixin Activity */
class ActivityLogResource extends JsonResource
{
    /**
     * Keys never surfaced in the diff - raw identifiers, timestamps and internal flags.
     * IDs are suppressed because they add noise without human value; subject label is shown separately.
     */
    private const SKIP_KEYS = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
        'remember_token',
        'email_verified_at',
        'password',
    ];

    /**
     * Suffixes that mark a foreign-key id column.
     */
    private const FK_SUFFIXES = ['_id'];

    /**
     * Non-_id columns that store user UUIDs - resolved to user names in diffs.
     */
    private const USER_REF_COLUMNS = [
        'confirmed_by',
        'cancelled_by',
        'deposit_waived_by',
        'overdue_waived_by',
        'early_return_charge_waived_by',
        'manual_discount_by',
    ];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $changes = $this->formatChanges();

        return [
            'id' => $this->id,
            'log_name' => $this->log_name,
            'description' => $this->resolveDescription($changes),
            'event' => $this->event,
            'subject_type' => $this->subject_type ? class_basename($this->subject_type) : null,
            'subject_label' => $this->resolveSubjectLabel(),
            'causer' => $this->causer ? [
                'id' => $this->causer->id,
                'name' => $this->causer->name,
                'email' => $this->causer->email,
            ] : null,
            'changes' => $changes,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Build a diff list containing only fields that actually changed.
     *
     * @return array<int, array{field: string, label: string, from: mixed, to: mixed}>
     */
    private function formatChanges(): array
    {
        $props = $this->properties;

        if (! $props || $props->isEmpty()) {
            return [];
        }

        $old = collect($props->get('old', []))->except(self::SKIP_KEYS);
        $attributes = collect($props->get('attributes', []))->except(self::SKIP_KEYS);

        $keys = $old->keys()->merge($attributes->keys())->unique()->values();

        $changes = [];
        foreach ($keys as $key) {
            if ($this->isForeignKeyColumn($key)) {
                continue;
            }

            $from = $this->castValue($old->get($key), $key);
            $to = $this->castValue($attributes->get($key), $key);

            /* Create events log attributes only (no old). Only skip when both equal and not a create. */
            if ($from === $to) {
                continue;
            }

            $changes[] = [
                'field' => $key,
                'label' => $this->humanizeField($key),
                'from' => $from,
                'to' => $to,
            ];
        }

        return $changes;
    }

    private function isForeignKeyColumn(string $key): bool
    {
        foreach (self::FK_SUFFIXES as $suffix) {
            if (str_ends_with($key, $suffix)) {
                return true;
            }
        }

        return false;
    }

    private function humanizeField(string $key): string
    {
        return Str::of($key)
            ->replace('_', ' ')
            ->title()
            ->toString();
    }

    /**
     * Cast a property value to a displayable scalar.
     * Date/datetime fields are formatted to human-readable strings.
     */
    private function castValue(mixed $value, string $key = ''): string|int|float|bool|null
    {
        if (is_null($value)) {
            return null;
        }

        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value) && $value !== '' && in_array($key, self::USER_REF_COLUMNS, true)) {
            return User::find($value)?->name ?? $value;
        }

        if (is_string($value) && $value !== '') {
            $isDateKey = str_ends_with($key, '_at') || str_ends_with($key, '_date') || str_ends_with($key, '_on');
            if ($isDateKey) {
                try {
                    $dt = Carbon::parse($value);

                    return str_ends_with($key, '_date') || str_ends_with($key, '_on')
                        ? $dt->format('d M Y')
                        : $dt->format('d M Y, g:i A');
                } catch (Throwable) {
                    /* fall through to raw value */
                }
            }
        }

        return $value;
    }

    /**
     * Produce a human-readable summary like
     * "Joyce Obaayaa James updated the employee details of 233554130056"
     * when Spatie's default description is the generic "{Subject} was {event}" string.
     */
    private function resolveDescription(array $changes): string
    {
        $raw = (string) $this->description;
        $event = (string) ($this->event ?: '');
        $causerName = $this->causer?->name ?? 'System';
        $subjectLabel = $this->resolveSubjectLabel();
        $subjectHuman = Str::of(class_basename((string) $this->subject_type))
            ->headline()
            ->lower()
            ->toString();

        $default = trim("{$subjectHuman} was {$event}");
        $isDefault = $raw === '' || strcasecmp($raw, $default) === 0;

        if (! $isDefault) {
            return Str::of($raw)->title()->toString();
        }

        $verb = match ($event) {
            'created' => 'created',
            'updated' => 'updated',
            'deleted' => 'deleted',
            'restored' => 'restored',
            default => $event ?: 'modified',
        };

        $tail = $subjectLabel ? "{$subjectHuman} {$subjectLabel}" : $subjectHuman;

        return Str::of("{$causerName} {$verb} {$tail}")->title()->toString();
    }

    /**
     * Attempt to produce a human label for the subject (name / reference / email / title / id).
     */
    private function resolveSubjectLabel(): ?string
    {
        $subject = $this->subject;

        if (! $subject) {
            return null;
        }

        foreach (['reference', 'booking_reference', 'name', 'full_name', 'title', 'email', 'license_number'] as $attr) {
            $value = data_get($subject, $attr);
            if (filled($value)) {
                return (string) $value;
            }
        }

        return null;
    }
}
