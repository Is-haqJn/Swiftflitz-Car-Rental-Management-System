<?php

namespace App\Http\Resources;

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use App\Http\Resources\BranchResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // 'email_verified_at' => $this->email_verified_at,
            'is_email_verified' => $this->email_verified_at !== null,
            // 'password' => $this->password,
            // 'remember_token' => $this->remember_token,
            'created_at' => $this->created_at,
            // 'updated_at' => $this->updated_at,
            'username' => $this->username,
            'phone' => $this->phone,
            'profile_photo_path' => $this->profile_photo_path,
            'profile_photo_url' => $this->profile_photo_path
                ? Storage::disk('public')->url($this->profile_photo_path)
                : null,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at,
            // 'notifications_count' => $this->notifications_count,
            // 'permissions_count' => $this->permissions_count,
            // 'read_notifications_count' => $this->read_notifications_count,
            // 'roles_count' => $this->roles_count,
            // 'tokens_count' => $this->tokens_count,
            // 'unread_notifications_count' => $this->unread_notifications_count,

            'permissions' => $this->whenLoaded('permissions')
                ? ($this->hasRole(RoleEnum::SUPER_ADMIN->value)
                    ? collect(config('swiftflitz.permissions.super_admin', []))
                    : $this->getPermissionsViaRoles()->pluck('name'))
                : null,
            'direct_permissions' => $this->whenLoaded('permissions')
                ? $this->getDirectPermissions()->pluck('name')
                : null,
            'all_permissions' => $this->whenLoaded('permissions')
                ? ($this->hasRole(RoleEnum::SUPER_ADMIN->value)
                    ? collect(config('swiftflitz.permissions.super_admin', []))
                    : $this->getAllPermissions()->pluck('name'))
                : null,
            'roles' => $this->whenLoaded('roles')
                ? $this->roles
                    ->pluck('name')
                    ->when(
                        ! $this->hasRole(RoleEnum::SUPER_ADMIN->value),
                        fn ($names) => $names->reject(fn ($name) => $name === RoleEnum::SUPER_ADMIN->value)
                    )->values()
                : null,

            'branches' => BranchResource::collection($this->whenLoaded('branches')),

            // 'permissions' => PermissionsResource::collection($this->whenLoaded('permissions') ? $this?->getPermissionsViaRoles()?->pluck('name') : null),
            // 'roles' => RoleResource::collection($this->whenLoaded('roles') ? $this?->roles()->pluck('name') : null),
        ];
    }
}
