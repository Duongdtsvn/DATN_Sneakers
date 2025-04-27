<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Order;

class VnPayController extends Controller
{
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
     
}