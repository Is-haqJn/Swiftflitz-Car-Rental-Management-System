<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('s3.aws_access_key_id', null);
        $this->migrator->add('s3.aws_secret_access_key', null);
        $this->migrator->add('s3.aws_default_region', null);
        $this->migrator->add('s3.aws_bucket', null);
        $this->migrator->add('s3.aws_url', null);
        $this->migrator->add('s3.aws_endpoint', null);
        $this->migrator->add('s3.use_path_style_endpoint', false);
    }
};
