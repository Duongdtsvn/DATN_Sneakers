<?php

namespace App\Http\Controllers\admin;

use App\Models\Brand;
use App\Models\Banner;
use App\Models\Gender;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductSize;
use App\Models\ImageProduct;
use Illuminate\Http\Request;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $title = "Sản phẩm";
        $query = Product::query();

        // Xử lý tìm kiếm
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('product_name', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('product_code', 'LIKE', '%' . $request->search . '%');

                // Nếu search là số, tìm theo giá
                if (is_numeric($request->search)) {
                    $q->orWhere('original_price', $request->search)
                        ->orWhere('discounted_price', $request->search);
                }
            });
        }

        // Xử lý lọc trạng thái (status: 0 = Inactive, 1 = Active)
        if ($request->has('status') && in_array($request->status, ['0', '1'])) {
            $query->where('status', $request->status);
        }

        // Lọc theo danh mục
        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        $categories = Category::all();
        $listProduct = $query->latest('id')->paginate(10);

        return view('admin.products.index', compact('title', 'listProduct', 'categories'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        $title = "Product";
        $listCategories = Category::where('status', true)->get();
        $listBrand = Brand::where('status', 'active')->get();
        $size= ProductSize::get();
        return view('admin.products.create', compact('title', 'listCategories','listBrand','size'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductRequest $request)
    {
        $params = $request->except('_token');

        if ($request->has('status')) {
            $params['status'] = 1;
        }

        // 👉 Validate biến thể TRƯỚC khi tạo sản phẩm
        $validatedData = $request->validate([
            'product_variants'                  => 'required|array', 
            'product_variants.*.product_size_id'=> 'required',
            'product_variants.*.quantity'       => 'required|integer|min:0', 
            'product_variants.*.status'         => 'nullable|in:0,1'
        ],[
            'product_variants.required' => 'Danh sách biến thể không được để trống!',
            'product_variants.array' => 'Dữ liệu biến thể không hợp lệ!',
            'product_variants.*.product_size_id.required' => 'Mỗi biến thể phải có một product_size_id!',                   
            'product_variants.*.quantity.required' => 'Số lượng là bắt buộc!',
            'product_variants.*.quantity.integer' => 'Số lượng phải là số nguyên!',
            'product_variants.*.status.in' => 'Trạng thái chỉ được là 0 hoặc 1!',
        ]);

        // 👉 Kiểm tra trùng size
        $sizeIDs = array_column($validatedData['product_variants'], 'product_size_id');
        if (count($sizeIDs) !== count(array_unique($sizeIDs))) {
            return redirect()->back()
                ->withErrors(['product_variants' => 'Không được chọn trùng size trong các biến thể!'])
                ->withInput();
        }

        try {
            DB::beginTransaction();

            // 👉 Upload ảnh chính
            if ($request->hasFile('image')) {
                $uploadedFileUrl = Cloudinary::upload($request->file('image')->getRealPath())->getSecurePath();
                $params['image'] = $uploadedFileUrl ?: null;
            }

            // 👉 Tạo sản phẩm
            $product = Product::create($params);
            $productID = $product->id;

            // 👉 Upload ảnh phụ
            if ($request->hasFile('list_image')) {
                foreach ($request->file('list_image') as $image) {
                    if ($image) {
                        $uploadedFileUrl = Cloudinary::upload($image->getRealPath())->getSecurePath();
                        $product->imageProduct()->create([
                            'product_id' => $productID,
                            'image_product' => $uploadedFileUrl,
                        ]);
                    }
                }
            }

            // 👉 Lưu biến thể
            foreach ($validatedData['product_variants'] as $variant) {
                ProductVariant::create([
                    'product_size_id'=> $variant['product_size_id'],
                    'product_id'=> $productID,               
                    'quantity'=> $variant['quantity'],
                    'status' => $variant['status'] ?? 1,
                ]);
            }

            DB::commit();

            return redirect()->route('admin.products.index')->with('success', 'Thêm sản phẩm thành công!');
        } catch (QueryException $e) {
            DB::rollBack();

            if ($e->errorInfo[1] == 1062) {
                $validator = Validator::make($request->all(), []);
                $validator->errors()->add('product_name', 'Mã sản phẩm đã tồn tại, vui lòng chọn mã khác.');

                return redirect()->back()
                    ->withErrors($validator)
                    ->withInput();
            }

            return redirect()->back()->with('error', 'Đã xảy ra lỗi! Vui lòng thử lại.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Lỗi không xác định! Vui lòng thử lại.');
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
        $title = "Cap nhat San pham";
        $product = Product::find($id);
        $category = Category::where('status', true)->get();
        $listBrand = Brand::where('status', 'active')->get();
        $size= ProductSize::get();
        $listVariant = ProductVariant::where('product_id', $id)->get();
        return view('admin.products.edit', compact('title', 'product', 'category','size','listBrand','listVariant'));
    }

    /**
     * Update the specified resource in storage.
     */
  public function update(ProductRequest $request, string $id)
    {
         try {
            $product = Product::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return back()->with('error', 'Sản phẩm không tồn tại!');
        }

        $params = $request->except('_token', '_method');
        $params['is_show_home'] = $request->has('is_show_home') ? $request->is_show_home : $product->is_show_home;

        try {
            DB::beginTransaction();

            // Xử lý ảnh đại diện mới nếu có
            if ($request->hasFile('image') && $request->file('image')->isValid()) {
                $newImageUrl = Cloudinary::upload($request->file('image')->getRealPath())->getSecurePath();

                if ($newImageUrl) {
                    // Xoá ảnh cũ trên Cloudinary
                    if ($product->image) {
                        $this->deleteCloudinaryImage($product->image);
                    }

                    $params['image'] = $newImageUrl;
                }
            }

            // Xử lý album nếu có hình ảnh trong list_hinh_anh
        if ($request->has('list_image') && is_array($request->list_image)) {
            $currentImages = $product->imageProduct->pluck('id')->toArray();
            $arrayCombine = array_combine($currentImages, $currentImages);

            // Xoá các ảnh không còn tồn tại trong list mới
            foreach ($arrayCombine as $key => $values) {
                if (!array_key_exists($key, $request->list_image)) {
                    $imageProduct = ImageProduct::find($key);
                    if ($imageProduct) {
                        try {
                            $publicId = $this->getCloudinaryPublicId($imageProduct->image); // ← cần hàm này
                            Cloudinary::destroy($publicId);
                        } catch (\Exception $e) {
                            Log::error('Lỗi xoá ảnh Cloudinary: ' . $e->getMessage());
                        }
                        $imageProduct->delete();
                    }
                }
            }

            // Thêm mới hoặc cập nhật ảnh
            foreach ($request->list_image as $key => $image) {
                if (!array_key_exists($key, $arrayCombine)) {
                    // Thêm mới
                    if ($request->hasFile("list_image.$key")) {
                        $file = $request->file("list_image.$key");
                        if ($file->isValid()) {
                            $uploadedFileUrl = Cloudinary::upload($file->getRealPath())->getSecurePath();
                            $product->imageProduct()->create([
                                'product_id' => $id,
                                'image_product' => $uploadedFileUrl
                            ]);
                        }
                    }
                } else if (is_file($image) && $request->hasFile("list_image.$key")) {
                    // Cập nhật ảnh cũ
                    $imageProduct = ImageProduct::find($key);
                    if ($imageProduct) {
                        try {
                            $publicId = $this->getCloudinaryPublicId($imageProduct->image);
                            Cloudinary::destroy($publicId);
                        } catch (\Exception $e) {
                            Log::error('Lỗi khi xoá ảnh cũ Cloudinary: ' . $e->getMessage());
                        }

                        $file = $request->file("list_image.$key");
                        if ($file->isValid()) {
                            $uploadedFileUrl = Cloudinary::upload($file->getRealPath())->getSecurePath();
                            $imageProduct->update([
                                'image_product' => $uploadedFileUrl
                            ]);
                        }
                    }
                }
            }
        }

            // Cập nhật sản phẩm
            $product->update($params);

            // Xử lý ảnh album
            //$this->handleProductImages($request, $product);

            // Validate và xử lý biến thể
            $this->handleProductVariants($request, $product);

            DB::commit();
            return redirect()->route('admin.products.index')->with('success', 'Cập nhật sản phẩm thành công!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lỗi khi cập nhật sản phẩm: ' . $e->getMessage());
            return back()->with('error', 'Cập nhật thất bại! Lỗi: ' . $e->getMessage());
        }
    }

    
    private function deleteCloudinaryImage($url)
    {
        try {
            $publicId = $this->getCloudinaryPublicId($url);
            Cloudinary::destroy($publicId);
        } catch (\Exception $e) {
            Log::error('Lỗi khi xoá ảnh trên Cloudinary: ' . $e->getMessage());
        }
    }

    private function getCloudinaryPublicId($url)
    {
        $parts = explode('/', parse_url($url, PHP_URL_PATH));
        $filename = end($parts);
        return pathinfo($filename, PATHINFO_FILENAME);
    }

    private function handleProductVariants(Request $request, Product $product)
{
    $validatedData = $request->validate([
        'product_variants' => 'required|array',
        'product_variants.*.product_size_id' => 'required|exists:product_sizes,id',
        'product_variants.*.quantity' => 'required|integer|min:0',
        'product_variants.*.status' => 'nullable|in:0,1'
    ], [
        'product_variants.required' => 'Danh sách biến thể không được để trống!',
        'product_variants.*.product_size_id.required' => 'Mỗi biến thể phải có product_size_id!',
        'product_variants.*.product_size_id.exists' => 'Product size không hợp lệ!',
        'product_variants.*.quantity.required' => 'Số lượng là bắt buộc!',
        'product_variants.*.quantity.integer' => 'Số lượng phải là số nguyên!',
        'product_variants.*.status.in' => 'Trạng thái chỉ được là 0 hoặc 1!',
    ]);

    $newVariantSizeIds = [];

    foreach ($validatedData['product_variants'] as $variant) {
        $newVariantSizeIds[] = $variant['product_size_id'];

        ProductVariant::updateOrCreate(
            [
                'product_id' => $product->id,
                'product_size_id' => $variant['product_size_id']
            ],
            [
                'quantity' => $variant['quantity'],
                'status' => $variant['status'] ?? 1
            ]
        );
    }

    // Xoá các biến thể không còn trong danh sách mới
    ProductVariant::where('product_id', $product->id)
        ->whereNotIn('product_size_id', $newVariantSizeIds)
        ->delete();
}







    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function productDiscontinued()
    {
        //
        $title = "Sản phẩm";
        $listProduct = Product::where('status', false)->get();
        return view('admin.products.productDiscontinued', compact('title', 'listProduct'));
    }
}
