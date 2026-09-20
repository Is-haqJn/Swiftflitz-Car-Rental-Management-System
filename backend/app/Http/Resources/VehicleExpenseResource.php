<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'vehicle_id'   => $this->vehicle_id,
            'type'         => $this->expense_type,
            'amount'       => $this->amount,
            'description'  => $this->description,
            'expense_date' => $this->expense_date?->format('Y-m-d'),
            'recorded_by'  => $this->recordedBy?->name,
            'receipts'     => $this->getMedia('receipts')->map(fn ($media) => [
                'id'        => $media->id,
                'url'       => $media->getUrl(),
                'name'      => $media->file_name,
                'mime_type' => $media->mime_type,
            ])->toArray(),
            'created_at'   => $this->created_at,
        ];
    }
}
