<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

   
    protected $fillable = [
        'product_code', 'product_name', 'image', 'description', 
        'original_price', 'discounted_price', 'category_id', 'brand_id','gender','care_instructions',
        'view', 'status', 'is_show_home'
    ];

    public function productVariants()
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }
    protected $casts = [
        'status' => 'boolean',
        'is_show_home' => 'boolean',
    ];


    // 🔗 Liên kết với `ProductVariant`

    //  public function category()
    // {
    //     return $this->belongsTo(Category::class);
    // }
    public function imageProduct()
    {
        return $this->hasMany(Imageproduct::class);
    }

    public function productVariant()
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    // 🔗 Liên kết với `Category`

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
    // protected $fillable = ['name', 'price', 'stock'];
    
    public function brand()
    {
       return $this->belongsTo(Brand::class);
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function getPriceWithoutPromotion()
    {
        return $this->discounted_price ?? $this->original_price;
    }
    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }
    // public function getDiscountedPriceAttribute()
    // {
    //     return $this->variants()->min('promotional_price') ?? $this->variants()->min('price');
    // }
   
}
