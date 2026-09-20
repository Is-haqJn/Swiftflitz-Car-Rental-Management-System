<?php

namespace App\Repositories\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;

interface FeatureRepositoryInterface extends QueryableRepositoryInterface
{
    public function getFeatures();

    public function getActive();
}
