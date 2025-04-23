<?php
namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class FilterProductsController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        $perPage = $request->input('per_page', 10);
        $brandId = $request->input('brand_id');
        $categoryId = $request->input('category_id');
        $minPrice = $request->input('min_price');
        $maxPrice = $request->input('max_price');
        $sort = $request->input('sort', ''); // Thêm tham số sort

        $productsQuery = Product::query()
            ->when($query, fn($q) => $q->where('product_name', 'LIKE', "%{$query}%"))
            ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
            ->when($categoryId, fn($q) => $q->where('category_id', $categoryId))
            ->when($minPrice, fn($q) => $q->where('discounted_price', '>=', $minPrice))
            ->when($maxPrice, fn($q) => $q->where('discounted_price', '<=', $maxPrice))
            ->with([
                'brand',
                'imageProduct',
                'productVariants' => function ($query) {
                    $query->where('status', 1)->with('productSize');
                }
            ])
            ->where('status', true);

        // Xử lý sắp xếp
        if ($sort === 'low-to-high') {
            $productsQuery->orderBy('discounted_price', 'asc');
        } elseif ($sort === 'high-to-low') {
            $productsQuery->orderBy('discounted_price', 'desc');
        }

        $products = $productsQuery->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products,
            'message' => 'Search results retrieved successfully'
        ]);
    }
}