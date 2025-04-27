<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommentLimit extends Model
{
    protected $fillable = ['user_id', 'date', 'comment_count'];

    protected $casts = [
        'date' => 'date',
    ];
}