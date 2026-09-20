<?php

namespace App\Http\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/** @mixin Role */
class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // 'team_id' => $this->team_id,
            'name' => $this->name,
            'label' => Str::title(str_replace('_', ' ', $this->name)),
            // 'guard_name' => $this->guard_name,
            // 'created_at' => $this->created_at,
            // 'updated_at' => $this->updated_at,
            'description' => $this->description,
            'is_system' => $this->is_default,
            'permissions_count' => $this->getAllPermissions()->count(),
            'permissions' => PermissionsResource::collection($this->getAllPermissions()),
        ];
    }
}
