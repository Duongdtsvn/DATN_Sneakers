@extends('admin.layouts.master')

@section('css')
    <style>
        /* Container chính */
        .product-detail-container {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }

        /* Ảnh chính */
        .main-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            border-radius: 8px;
            transition: transform 0.3s ease;
        }

        .main-image:hover {
            transform: scale(1.02);
        }

        /* Ảnh thumbnail */
        .thumbnail-img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border: 2px solid transparent;
            border-radius: 6px;
            cursor: pointer;
            transition: border-color 0.3s ease, transform 0.3s ease;
        }

        .thumbnail-img:hover {
            border-color: #0d6efd;
            transform: scale(1.05);
        }

        .thumbnail-img.active {
            border-color: #0d6efd;
        }

        /* Thông tin sản phẩm */
        .product-info h3 {
            font-size: 1.8rem;
            font-weight: 700;
            color: #333;
        }

        .product-info p {
            margin-bottom: 10px;
            font-size: 1rem;
            color: #555;
        }

        .product-info .price-original {
            text-decoration: line-through;
            color: #999;
        }

        .product-info .price-discount {
            color: #dc3545;
            font-weight: bold;
            font-size: 1.2rem;
        }

        .stock-status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 12px;
            font-size: 0.9rem;
        }

        .stock-status.in-stock {
            background: #28a745;
            color: #fff;
        }

        .stock-status.out-stock {
            background: #dc3545;
            color: #fff;
        }

        /* Size và số lượng */
        .size-box {
            padding: 8px 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 0.9rem;
            transition: background 0.3s ease;
            cursor: default;
        }

        .size-box:hover {
            background: #f8f9fa;
        }

        .size-box.out-of-stock {
            background: #f8d7da;
            color: #721c24;
            border-color: #f5c6cb;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .main-image {
                height: 300px;
            }

            .thumbnail-img {
                width: 60px;
                height: 60px;
            }

            .product-info h3 {
                font-size: 1.5rem;
            }
        }
    </style>
@endsection

@section('content')
    <div class="container-xxl py-4">
        <div class="product-detail-container">
            <div class="row">
                <!-- Ảnh sản phẩm -->
                <div class="col-md-6 mb-4">
                    <img src="{{$product->image}}" class="main-image" id="mainImage" alt="Ảnh đại diện">
                    <div class="mt-3 d-flex flex-wrap gap-2">
                        @foreach ($product->imageProduct as $index => $image)
                            <img src="{{$image->image_product}}" class="thumbnail-img active" data-src="related1.jpg" alt="Thumbnail 1">
                        @endforeach
                    </div>
                </div>

                <!-- Thông tin chi tiết -->
                <div class="col-md-6 product-info">
                    <h3>{{$product->product_name}}</h3>
                    <p><strong>Mã sản phẩm:</strong> {{$product->product_code}}</p>
                    <p>
                        <strong>Giá gốc:</strong> <span class="price-original">{{ number_format($product->original_price) }}đ</span><br>
                        <strong>Giá khuyến mãi:</strong> <span class="price-discount">{{ number_format($product->discounted_price) }}đ</span>
                    </p>
                    <p><strong>Mô tả:</strong> {{$product->description}}</p>                   
                    <p><strong>Giới tính:</strong> {{$product->gender == 0 ? 'Nữ' : 'Nam'}}</p>
                    <p><strong>Bảo quản:</strong> {{$product->care_instructions}}</p>
                    <p><strong>Danh mục:</strong> {{ $product->category->category_name }}</p>
                    <p><strong>Thương hiệu:</strong> {{ $product->brand->brand_name }}</p>

                    <!-- Size và số lượng -->
                    <div class="mt-4">
                        <h5><strong>Các size còn lại:</strong> </h5>
                        <div class="d-flex flex-wrap gap-2">
                            @foreach ($listVariant as $item)
                                <div class="size-box {{$item->quantity == 0 ? "out-of-stock" : ""}}">Size {{$item->productSize->name}} - SL: {{$item->quantity}}</div>
                            @endforeach                         
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('js')
   
@endsection