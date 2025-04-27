<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;

class HomeController extends Controller
{
    //
    public function getHomeProducts(): JsonResponse
    {
        $products = Product::with([
        'category',
        'productVariant' => function ($query) {
            $query->with('productSize'); // Thêm thông tin về kích thước sản phẩm
        },
        'imageProduct' // Thêm thông tin về hình ảnh sản phẩm
        ])
            ->where('is_show_home', true)
            ->where('status', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
    public function getBrands(){
        $brands = Brand::where('status', 'active')->get();
        return response()->json([
            'success' => true,
            'data' => $brands
        ]);
    }
    public function brandsByProduct($id)
    {

         $products = Product::with([
        'Brand',
        'productVariant' => function ($query) {
            $query->with('productSize'); // Lấy thông tin kích thước của sản phẩm
        },
        'imageProduct' // Lấy thông tin hình ảnh của sản phẩm
        ])
            ->where('status', true)
            ->where('brand_id', $id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
    public function getTopViewedProducts()
    {
        $products = Product::where('status', true) // Chỉ lấy sản phẩm đang hoạt động
            ->orderByDesc('view') // Sắp xếp theo lượt xem giảm dần          
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Top viewed products retrieved successfully',
            'data' => $products
        ]);
    }
    public function productSale(Request $request)
    {
        // Lọc các sản phẩm có khuyến mãi >= 30%
        $products = Product::all()->filter(function ($product) {
            return $product->getDiscountPercentage() >= 30;
        });

        // Trả về kết quả dưới dạng JSON Resource
       return response()->json($products);
    }
}
