<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'user_id', 'content'];

    protected $with = ['user', 'product', 'replies'];

    public function user()
    {
        return $this->belongsTo(User::class)->select('id', 'name');
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->select('id', 'product_name');
    }

    public function replies()
    {
        return $this->hasMany(Reply::class);
    }
}