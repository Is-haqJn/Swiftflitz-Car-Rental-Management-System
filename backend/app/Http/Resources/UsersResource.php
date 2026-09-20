<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UsersResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_email_verified' => $this->email_verified_at !== null,
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

            'roles' => $this->whenLoaded('roles', fn () => RoleResource::collection($this->roles)),
            'all_permissions' => $this->whenLoaded('permissions', fn () => $this->getAllPermissions()->pluck('name')),
            'direct_permissions' => $this->whenLoaded('permissions', fn () => $this->getDirectPermissions()->pluck('name')),
            'branches' => $this->whenLoaded('branches', fn () => BranchResource::collection($this->branches)),
        ];
    }
}
