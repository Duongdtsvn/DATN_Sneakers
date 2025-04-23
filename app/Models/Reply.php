<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reply extends Model
{
    use HasFactory;

    protected $fillable = ['comment_id', 'user_id', 'content'];

    protected $with = ['user'];

    public function user()
    {
        return $this->belongsTo(User::class)->select('id', 'name');
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
}