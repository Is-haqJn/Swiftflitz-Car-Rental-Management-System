<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\Permission\Models\Permission;

/** @mixin Permission */
class PermissionsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // 'guard_name' => $this->guard_name,
            // 'created_at' => $this->created_at,
            // 'updated_at' => $this->updated_at,
            'description' => $this->description,
            'group' => $this->group,
            // 'permissions_count' => $this->permissions_count,
            // 'roles_count' => $this->roles_count,

            // 'permissions' => PermissionsResource::collection($this->whenLoaded('permissions')),
            // 'roles' => RoleResource::collection($this->whenLoaded('roles')),
        ];
    }
}
