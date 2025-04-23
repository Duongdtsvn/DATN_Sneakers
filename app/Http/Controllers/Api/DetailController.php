<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class DetailController extends Controller
{
    //
     public function getProductDetail($id): JsonResponse
    {
        $product = Product::with([
        'category',
        'productVariant' => function ($query) {
            $query->with('productSize'); // Load luôn productSize nếu cần
        },
        'imageProduct'
        ])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại!'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }
    public function getRelatedProducts($id)
    {
        $product = Product::findOrFail($id);

        // Lấy các sản phẩm cùng danh mục (loại trừ sản phẩm hiện tại)
            $relatedProducts = Product::with(['category', 'productVariant', 'imageProduct']) // Lấy thêm quan hệ
        ->where('category_id', $product->category_id)
        ->where('id', '!=', $product->id)
        ->where('status', true) // Chỉ lấy sản phẩm đang hoạt động
        ->latest() // Sắp xếp theo sản phẩm mới nhất
        ->take(7) // Giới hạn 5 sản phẩm
        ->get();

        return response()->json([
            'success' => true,
            'data' => $relatedProducts
        ]);

    }
}
