<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductSize;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Tạo đơn hàng từ giỏ hàng (tích hợp với Checkout.tsx)
     */
    public function createOrderFromCart(Request $request): JsonResponse
    {
        $request->validate([
            'shipping_info.fullName' => 'required|string|min:2',
            'shipping_info.email' => 'required|email',
            'shipping_info.phone' => 'required|regex:/^[0-9]{10,11}$/',
            'shipping_info.address' => 'required|string|min:5',
            'coupon_code' => 'nullable|string',
        ]);

        $user = Auth::user();
        $shippingInfo = $request->input('shipping_info');
        $couponCode = $request->input('coupon_code');

        // Lấy giỏ hàng của user
        $cart = Cart::where('user_id', $user->id)->first();
        if (!$cart) {
            return response()->json(['message' => 'Giỏ hàng của bạn đang trống!'], 400);
        }

        $cartItems = CartItem::where('cart_id', $cart->id)->with('product')->get();
        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Không có sản phẩm nào trong giỏ hàng!'], 400);
        }

        return DB::transaction(function () use ($request, $user, $cartItems, $shippingInfo, $couponCode) {
            // Tính tổng tiền trước giảm giá
            $totalPriceBeforeDiscount = $cartItems->sum(function ($item) {
                return ($item->discounted_price ?? $item->original_price) * $item->quantity;
            });

            // Mặc định phí vận chuyển
            $shippingFee = 30000;
            $promotionAmount = 0;

            // Kiểm tra mã khuyến mãi nếu có
            if ($couponCode) {
                $promotion = DB::table('promotions')
                    ->where('promotion_name', $couponCode)
                    ->where('status', 1)
                    ->whereDate('start_date', '<=', now())
                    ->whereDate('end_date', '>=', now())
                    ->first();

                if ($promotion) {
                    if ($promotion->discount_type === 'Giảm theo %') {
                        $promotionAmount = ($totalPriceBeforeDiscount * $promotion->discount_value) / 100;
                        if (!empty($promotion->max_discount_value)) {
                            $promotionAmount = min($promotionAmount, $promotion->max_discount_value);
                        }
                    } elseif ($promotion->discount_type === 'Giảm số tiền') {
                        $promotionAmount = min($promotion->discount_value, $totalPriceBeforeDiscount);
                    }
                } else {
                    return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn!'], 400);
                }
            }

            // Tính tổng tiền cuối cùng
            $finalTotalPrice = max(($totalPriceBeforeDiscount - $promotionAmount) + $shippingFee, 0);

            // Tạo mã đơn hàng
            $orderCode = 'ORD' . strtoupper(Str::random(10));

            // Tạo đơn hàng
            $order = Order::create([
                'user_id' => $user->id,
                'order_code' => $orderCode,
                'recipient_name' => $shippingInfo['fullName'],
                'recipient_phone' => $shippingInfo['phone'],
                'recipient_address' => $shippingInfo['address'],
                'total_price' => $finalTotalPrice,
                'promotion' => $promotionAmount,
                'shipping_fee' => $shippingFee,
                'payment_method' => 'COD',
                'payment_status' => 'chua_thanh_toan',
                'status' => 'cho_xac_nhan',
            ]);

            // Lưu chi tiết đơn hàng
            foreach ($cartItems as $item) {
                $productVariant = ProductVariant::where('product_id', $item->product_id)
                    ->where('product_size_id', $item->product_size_id)
                    ->lockForUpdate()
                    ->first();

                if (!$productVariant || $productVariant->quantity < $item->quantity) {
                    throw new \Exception("Sản phẩm {$item->product->product_name} (size {$item->product_size_id}) không đủ số lượng");
                }

                OrderDetail::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $productVariant->id,
                    'quantity' => $item->quantity,
                    'price' => $item->discounted_price ?? $item->original_price,
                ]);

                $productVariant->decrement('quantity', $item->quantity);
            }

            // Xóa giỏ hàng sau khi đặt hàng thành công
            Log::info('Deleting cart items for cart_id: ' . $cart->id);
            $deletedItems = CartItem::where('cart_id', $cart->id)->delete();
            Log::info('Deleted ' . $deletedItems . ' cart items');
            
            Log::info('Deleting cart: ' . $cart->id);
            $cart->delete();
            Log::info('Cart deleted successfully');

            return response()->json([
                'message' => 'Đặt hàng thành công!',
                'order_id' => $order->id,
                'order_code' => $orderCode,
                'purchased_items' => $cartItems->map(function($item) {
                    return [
                        'product_id' => $item->product_id,
                        'product_size_id' => $item->product_size_id,
                        'quantity' => $item->quantity
                    ];
                })->toArray()
            ], 201);
        });
    }

    /**
     * Mua sản phẩm trực tiếp theo tên
     */
    public function buyProductByName(Request $request, $product_name): JsonResponse
    {
        $request->validate([
            'product_size_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'promotion_name' => 'nullable|string'
        ]);

        $user = Auth::user();

        if (!$user->phone || !$user->address) {
            return response()->json(['message' => 'Vui lòng cập nhật số điện thoại và địa chỉ trước khi mua hàng!'], 400);
        }

        $product = Product::firstWhere('product_name', $product_name);
        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại!'], 404);
        }

        return DB::transaction(function () use ($request, $product, $user) {
            $productVariant = ProductVariant::where('product_id', $product->id)
                ->where('product_size_id', $request->product_size_id)
                ->lockForUpdate()
                ->first();

            if (!$productVariant) {
                return response()->json(['message' => 'Không tìm thấy biến thể sản phẩm!'], 404);
            }

            if ($productVariant->quantity < $request->quantity) {
                return response()->json(['message' => 'Kho không đủ hàng!'], 503);
            }

            $price = $product->discounted_price ?? $product->original_price;
            $totalPriceBeforeDiscount = $price * $request->quantity;

            $shippingFee = 30000;
            $promotionAmount = 0;

            if ($request->filled('promotion_name')) {
                $promotion = DB::table('promotions')
                    ->where('promotion_name', $request->promotion_name)
                    ->where('status', 1)
                    ->whereDate('start_date', '<=', now())
                    ->whereDate('end_date', '>=', now())
                    ->first();

                if ($promotion) {
                    if ($promotion->discount_type === 'Giảm theo %') {
                        $promotionAmount = ($totalPriceBeforeDiscount * $promotion->discount_value) / 100;
                        if (!empty($promotion->max_discount_value)) {
                            $promotionAmount = min($promotionAmount, $promotion->max_discount_value);
                        }
                    } elseif ($promotion->discount_type === 'Giảm số tiền') {
                        $promotionAmount = min($promotion->discount_value, $totalPriceBeforeDiscount);
                    }
                } else {
                    return response()->json(["message" => "Mã giảm giá không hợp lệ hoặc đã hết hạn!"], 400);
                }
            }

            $finalTotalPrice = max(($totalPriceBeforeDiscount - $promotionAmount) + $shippingFee, 0);

            $orderCode = 'ORD' . strtoupper(Str::random(10));

            $order = Order::create([
                'user_id' => $user->id,
                'order_code' => $orderCode,
                'recipient_name' => $user->name,
                'recipient_phone' => $user->phone,
                'recipient_address' => $user->address,
                'total_price' => $finalTotalPrice,
                'promotion' => $promotionAmount,
                'shipping_fee' => $shippingFee,
                'payment_method' => 'VNPAY',
                'payment_status' => 'chua_thanh_toan',
                'status' => 'cho_xac_nhan',
            ]);

            OrderDetail::create([
                'order_id' => $order->id,
                'product_variant_id' => $productVariant->id,
                'quantity' => $request->quantity,
                'price' => $price,
            ]);

            $productVariant->decrement('quantity', $request->quantity);


            // Kiểm tra và xóa sản phẩm khỏi giỏ hàng nếu có
            $cart = Cart::where('user_id', $user->id)->first();
            if ($cart) {
                CartItem::where('cart_id', $cart->id)
                    ->where('product_id', $product->id)
                    ->where('product_size_id', $request->product_size_id)
                    ->delete();
            }

            // Tạo URL thanh toán VNPAY
            $vnpUrl = $this->createVNPayPaymentUrl($order);

            return response()->json([
                'message' => 'Tạo đơn hàng thành công, chuyển đến VNPAY!',
                'redirect_url' => $vnpUrl,
            ], 201);
        });
    }

    private function createVNPayPaymentUrl($order)
{
    // Thiết lập múi giờ
    date_default_timezone_set('Asia/Ho_Chi_Minh');

    // Cấu hình VNPay từ .env
    $vnp_Url = env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    $vnp_Returnurl = env('VNPAY_RETURN_URL', 'https://38c7-2405-4802-21a-ab90-cd32-49af-4dbb-f211.ngrok-free.app');
    $vnp_TmnCode = env('VNPAY_TMN_CODE', 'M5599FDJ');
    $vnp_HashSecret = env('VNPAY_HASH_SECRET', 'RE3CGAO0B0DH570H1PIXLX9ZHQA7MI3P');

    // Dữ liệu đơn hàng
    $vnp_TxnRef = $order->order_code;
    $vnp_OrderInfo = "Thanh toan don hang #" . $vnp_TxnRef; // Có thể mã hóa nếu cần
    $vnp_OrderType = "billpayment";
    $vnp_Amount = $order->total_price * 100; // VNPay yêu cầu số tiền * 100
    $vnp_Locale = "vn";
    $vnp_BankCode = ""; // Để trống nếu không chọn ngân hàng cụ thể
    $vnp_IpAddr = request()->ip();

    // Tạo mảng dữ liệu đầu vào
    $inputData = [
        "vnp_Version" => "2.1.0",
        "vnp_TmnCode" => $vnp_TmnCode,
        "vnp_Amount" => $vnp_Amount,
        "vnp_Command" => "pay",
        "vnp_CreateDate" => date('YmdHis'),
        "vnp_CurrCode" => "VND",
        "vnp_IpAddr" => $vnp_IpAddr,
        "vnp_Locale" => $vnp_Locale,
        "vnp_OrderInfo" => $vnp_OrderInfo,
        "vnp_OrderType" => $vnp_OrderType,
        "vnp_ReturnUrl" => $vnp_Returnurl,
        "vnp_TxnRef" => $vnp_TxnRef,
    ];

    // Thêm vnp_BankCode nếu có
    if (!empty($vnp_BankCode)) {
        $inputData["vnp_BankCode"] = $vnp_BankCode;
    }

    // Sắp xếp mảng theo thứ tự bảng chữ cái
    ksort($inputData);

    // Tạo chuỗi hashData và query
    $hashData = "";
    $query = "";
    $i = 0;
    foreach ($inputData as $key => $value) {
        // Tạo hashData (đã mã hóa URL để đảm bảo đúng định dạng)
        if ($i == 1) {
            $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
        } else {
            $hashData .= urlencode($key) . "=" . urlencode($value);
            $i = 1;
        }
        // Tạo query cho URL
        $query .= urlencode($key) . "=" . urlencode($value) . '&';
    }
    $query = rtrim($query, '&');

    // Tạo chữ ký vnp_SecureHash
    $vnpSecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

    // Tạo URL thanh toán
    $vnp_Url .= '?' . $query . '&vnp_SecureHash=' . $vnpSecureHash;
    return $vnp_Url;
}

    

    public function vnpayReturn(Request $request)
    {
        $vnp_ResponseCode = $request->input('vnp_ResponseCode');
        $vnp_TxnRef = $request->input('vnp_TxnRef');

        $order = Order::where('order_code', $vnp_TxnRef)->first();

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng!'], 404);
        }

        if ($vnp_ResponseCode === '00') {
            $order->update([
                'payment_status' => 'da_thanh_toan',
                'status' => 'dang_chuan_bi'
            ]);
            return response()->json(['message' => 'Thanh toán thành công!']);
        } else {
            $order->update([
                'payment_status' => 'that_bai',
                'status' => 'huy'
            ]);
            return response()->json(['message' => 'Thanh toán thất bại!']);
        }
    }

    /**
     * Hiển thị danh sách đơn hàng của user
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $ordersPaginator = Order::with([
            'user',
            'orderDetails.productVariant.product',
            'orderDetails.productVariant.productSize'
        ])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $responseData = [
            'data' => $ordersPaginator->getCollection()->map(function ($order) {
                return $this->formatOrderData($order);
            }),
            'links' => [
                'first' => $ordersPaginator->url(1),
                'last' => $ordersPaginator->url($ordersPaginator->lastPage()),
                'prev' => $ordersPaginator->previousPageUrl(),
                'next' => $ordersPaginator->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $ordersPaginator->currentPage(),
                'from' => $ordersPaginator->firstItem(),
                'last_page' => $ordersPaginator->lastPage(),
                'path' => $ordersPaginator->path(),
                'per_page' => $ordersPaginator->perPage(),
                'to' => $ordersPaginator->lastItem(),
                'total' => $ordersPaginator->total(),
            ],
        ];

        return response()->json($responseData);
    }

    /**
     * Hiển thị chi tiết đơn hàng
     */
    public function show(Order $order): JsonResponse
    {
        Gate::authorize('view', $order);

        $order->load([
            'user',
            'orderDetails.productVariant.product',
            'orderDetails.productVariant.productSize'
        ]);

        return response()->json($this->formatOrderData($order));
    }

    /**
     * Xử lý yêu cầu hủy đơn hàng từ khách hàng
     */
    public function requestCancellation(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'cancellation_reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        Gate::authorize('view', $order); // Kiểm tra quyền sở hữu

        if (!$order->canBeCancelledByUser()) {
            Log::warning('Cancel order: Order cannot be cancelled', [
                'order_id' => $order->id,
                'status' => $order->status,
                'user_id' => Auth::id(),
            ]);
            return response()->json([
                'message' => 'Đơn hàng không thể hủy tại thời điểm này!',
                'current_status' => $order->status
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Lưu trạng thái trước đó
            $order->previous_status = $order->status;
            $order->status = Order::CHO_XAC_NHAN_HUY;
            $order->cancellation_reason = $request->input('cancellation_reason');
            $order->save();

            DB::commit();

            $order->load([
                'user',
                'orderDetails.productVariant.product',
                'orderDetails.productVariant.productSize'
            ]);

            Log::info('Cancel order request submitted', [
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'reason' => $request->input('cancellation_reason'),
            ]);

            return response()->json([
                'message' => 'Yêu cầu hủy đã được gửi thành công.',
                'order' => $this->formatOrderData($order)
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cancel order server error', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Đã xảy ra lỗi server khi gửi yêu cầu hủy đơn hàng!', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Hàm hỗ trợ định dạng dữ liệu đơn hàng
     */
    protected function formatOrderData(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_code' => $order->order_code ?? null,
            'recipient_name' => $order->recipient_name,
            'recipient_phone' => $order->recipient_phone,
            'recipient_address' => $order->recipient_address,
            'promotion' => (float) ($order->promotion ?? 0),
            'shipping_fee' => (float) ($order->shipping_fee ?? 0),
            'total_price' => (float) $order->total_price,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'status' => $order->status,
            'cancellation_reason' => $order->cancellation_reason,
            'previous_status' => $order->status === Order::CHO_XAC_NHAN_HUY ? $order->previous_status : null,
            'created_at' => $order->created_at ? $order->created_at->toISOString() : null,
            'updated_at' => $order->updated_at ? $order->updated_at->toISOString() : null,
            'order_details' => $order->orderDetails->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'product_id' => $detail->productVariant->product_id,
                    'product_name' => $detail->productVariant->product->product_name,
                    'variant_id' => $detail->product_variant_id,
                    'size' => $detail->productVariant->productSize->name ?? 'N/A',
                    'quantity' => $detail->quantity,
                    'price' => (float) $detail->price,
                    'image_url' => $detail->productVariant->product->image
                ];
            })->all(),
        ];
    }

    /**
     * Hàm hỗ trợ lấy text trạng thái
     */
    protected function getStatusText(?string $status): string
    {
        return Order::ORDER_STATUS[$status] ?? 'Không xác định';
    }

    
}