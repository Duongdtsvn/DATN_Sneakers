@extends('admin.layouts.master')

@section('content')
    <div class="container-xxl mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="fw-semibold">Danh Sách Danh Mục</h4>
            <a href="{{ route('admin.categories.create') }}" class="btn btn-success">
                <i class="bi bi-plus-lg"></i> Thêm mới
            </a>
        </div>

        {{-- Hiển thị thông báo thành công --}}
        @if (session('success'))
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle"></i> {{ session('success') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif

        <div class="card shadow">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-bordered text-center align-middle">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Tên Danh Mục</th>
                                <th>Trạng Thái</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody> 
                            @foreach ($category as $item)
                                <tr>
                                    <td>{{ $item->id }}</td>
                                    <td class="text-start">{{ $item->category_name }}</td>
                                    <td>
                                        <span class="badge {{ $item->status == 0 ? 'bg-danger' : 'bg-success' }}">
                                            {{ $item->status == 0 ? 'Inactive' : 'Active' }}
                                        </span>
                                    </td>
                                    <td>
                                        <a href="{{ route('admin.categories.edit', $item->id) }}"
                                            class="btn btn-sm btn-outline-primary">
                                            <i class="mdi mdi-pencil"></i> Sửa
                                        </a>

                                        <form action="{{ route('admin.categories.destroy', $item->id) }}" method="POST"
                                            class="d-inline">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-sm btn-outline-danger"
                                                onclick="return confirm('Bạn có chắc chắn muốn xóa?')">
                                                <i class="mdi mdi-delete"></i> Xóa
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
