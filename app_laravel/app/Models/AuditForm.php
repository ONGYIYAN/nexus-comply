<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditForm extends Model
{
    use HasFactory;

    protected $table = 'audit_form';

    protected $fillable = [
        'name',
        'value',
        'form_id',
        'status_id',
        'ai_analysis'
    ];

    protected $casts = [
        'value' => 'array',
        'ai_analysis' => 'array'
    ];

    public function audits()
    {
        return $this->belongsToMany(Audit::class, 'audit_audit_form', 'audit_form_id', 'audit_id');
    }

    public function formTemplate()
    {
        return $this->belongsTo(FormTemplate::class, 'form_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function issues()
    {
        return $this->hasMany(Issue::class);
    }
} 