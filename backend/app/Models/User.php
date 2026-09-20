<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, LogsActivity, Notifiable;
    use HasRoles {
        getAllPermissions as getBaseAllPermissions;
        hasPermissionTo as baseHasPermissionTo;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'phone',
        'profile_photo_path',
        'is_active',
        'last_login_at',
        'revoked_permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Check if the user has the given permission, excluding any explicitly revoked permissions.
     *
     * @param  string|\Spatie\Permission\Contracts\Permission  $permission
     */
    public function hasPermissionTo($permission, $guardName = null): bool
    {
        $permName = $permission instanceof \Spatie\Permission\Contracts\Permission
            ? $permission->name
            : $permission;

        if (in_array($permName, $this->revoked_permissions ?? [], true)) {
            return false;
        }

        try {
            return $this->baseHasPermissionTo($permission, $guardName);
        } catch (\Spatie\Permission\Exceptions\PermissionDoesNotExist) {
            return false;
        }
    }

    /**
     * Return all permissions, excluding explicitly revoked ones.
     *
     * @return \Illuminate\Support\Collection<int, \Spatie\Permission\Models\Permission>
     */
    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        $revoked = $this->revoked_permissions ?? [];

        return $this->getBaseAllPermissions()
            ->filter(fn ($p) => ! in_array($p->name, $revoked, true))
            ->values();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_user');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'username', 'phone', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('user')
            ->setDescriptionForEvent(fn (string $eventName) => "User {$this->name} was {$eventName}");
    }

    /**
     * Send the password reset notification via a queued job.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'revoked_permissions' => 'array',
        ];
    }
}
