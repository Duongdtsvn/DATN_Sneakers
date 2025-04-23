@extends('admin.layouts.master')
@section('content')
    <div class="container-xxl">

        <div class="py-3 d-flex align-items-sm-center flex-sm-row flex-column">
            <div class="flex-grow-1">
                <h4 class="fs-18 fw-semibold m-0">{{ $title }}</h4>
            </div>
            <a href="{{ route('admin.products.create') }}" class="btn btn-success ">Thêm mới</a>
        </div>

        {{-- Tìm kiếm và lọc --}}
        <form method="GET" action="{{ request()->url() }}" class="row g-2 align-items-center mb-3">
            <div class="col-lg-4 col-md-6">
                <div class="input-group shadow-sm">
                    <input type="text" name="search" class="form-control" placeholder="Nhập từ khóa..."
                        value="{{ request('search') }}">
                </div>
            </div>
            <div class="col-lg-2 col-md-6">
                <div class="input-group shadow-sm">
                    <select name="category_id" class="form-select">
                        <option value="">Chọn danh mục</option>
                        @foreach ($categories as $category)
                            <option value="{{ $category->id }}"
                                {{ request('category_id') == $category->id ? 'selected' : '' }}>
                                {{ $category->category_name }}
                            </option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="col-lg-2 col-md-6">
                <div class="input-group shadow-sm">
                    <select name="status" class="form-select">
                        <option value="">Chọn trạng thái</option>
                        <option value="1" {{ request('status') == '1' ? 'selected' : '' }}>Active</option>
                        <option value="0" {{ request('status') == '0' ? 'selected' : '' }}>Inactive</option>
                    </select>
                </div>
            </div>

            <div class="col-lg-4 col-md-6 text-end">
                <button type="submit" class="btn btn-success shadow-sm"><i class="bi bi-funnel"></i> Lọc</button>
                <a href="{{ request()->url() }}" class="btn btn-secondary shadow-sm"><i class="bi bi-arrow-clockwise"></i>
                    Reset</a>
            </div>
        </form>

        <div class="card shadow">
            <div class="card-body">
                <div class="table-responsive">
                    @if (session('success'))
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            {{ session('success') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    @endif
                    <table class="table table-hover table-bordered align-middle small">
                        <thead class='table-dark text-center'>
                            <tr>
                                <th scope="col">STT</th>
                                <th scope="col">Mã SP</th>
                                <th scope="col">Tên sản phẩm</th>
                                <th scope="col">Hình ảnh</th>
                                <th scope="col">Giá gốc (VND)</th>
                                <th scope="col">Giá khuyến mãi (VND)</th>
                                <th scope="col">Danh mục</th>
                                <th scope="col">Trạng thái</th>
                                <th scope="col">Hiển thị</th>
                                <th scope="col">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($listProduct as $item)
                                <tr>
                                    <th scope="row">{{ $item->id }}</th>
                                    <td>{{ $item->product_code }}</td>
                                    <td>{{ $item->product_name }}</td>
                                    <td>
                                        <img src="{{ $item->image ?? asset('images/default-product.png') }}"
                                            alt="Product Image" width="100px">
                                    </td>
                                    <td>{{ number_format($item->original_price) }}</td>
                                    <td>{{ number_format($item->discounted_price) }}</td>
                                    <td>{{ $item->category->category_name }}</td>
                                    <td class="{{ $item->status == 0 ? 'text-danger' : 'text-success' }}">
                                        <i
                                            class="mdi {{ $item->status == 0 ? 'mdi-close-circle' : 'mdi-check-circle' }}"></i>
                                        {{ $item->status == 0 ? 'Inactive' : 'Active' }}
                                    </td>
                                    <td class="{{ $item->is_show_home == 0 ? 'text-danger' : 'text-success' }}">
                                        <i class="mdi {{ $item->is_show_home == 0 ? 'mdi-eye-off' : 'mdi-eye' }}"></i>
                                        {{ $item->is_show_home == 0 ? 'Ẩn' : 'Hiển thị' }}
                                    </td>
                                    <td>
                                        <a href="{{ route('admin.products.edit', $item->id) }}" title="Chỉnh sửa">
                                            <i class="mdi mdi-pencil text-primary fs-18 border p-1"></i>
                                        </a>
                                        <a href="{{ route('admin.products.show', $item->id) }}"
                                            title="Xem chi tiết">
                                            <i class="mdi mdi-plus text-success fs-18 border p-1"></i>
                                        </a>
                                        {{-- <a href="{{ route('admin.products.destroy', $item->id) }}"
                                            onclick="return confirm('Bạn có chắc chắn muốn xoá sản phẩm này không?')"
                                            title="Xóa sản phẩm">
                                            <i class="mdi mdi-delete text-danger fs-18 border p-1"></i>
                                        </a> --}}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
            {{-- Pagination --}}
            <div class="d-flex justify-content-center mt-3">
                {{ $listProduct->links('pagination::bootstrap-5') }}
            </div>
        </div>
    </div>
@endsection
