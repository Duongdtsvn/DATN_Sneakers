@extends('admin.layouts.master')

@section('content')
    <div class="container-xxl mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="fw-semibold">Danh Sách Bình Luận</h4>
        </div>

        @if (session('success'))
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle"></i> {{ session('success') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif

        @if (session('error'))
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-circle"></i> {{ session('error') }}
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
                                <th>Sản Phẩm</th>
                                <th>Người Dùng</th>
                                <th>Nội Dung</th>
                                <th>Ngày</th>
                                <th>Trả Lời</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($comments as $comment)
                                <tr>
                                    <td>{{ $comment->id }}</td>
                                    <td class="text-start">
                                        {{ $comment->product ? $comment->product->product_name : 'Sản phẩm không tồn tại' }}
                                    </td>
                                    <td>{{ $comment->user ? $comment->user->name : 'Người dùng không tồn tại' }}</td>
                                    <td class="text-start">
                                        {{ \Illuminate\Support\Str::limit($comment->content, 50) }}
                                        @if ($comment->replies->count() > 0)
                                            <div class="mt-2 text-sm">
                                                @foreach ($comment->replies as $reply)
                                                    <div class="border-l-2 border-gray-300 pl-2 my-2">
                                                        <strong>{{ $reply->user->name }} (Admin):</strong>
                                                        {{ \Illuminate\Support\Str::limit($reply->content, 50) }}
                                                        <br>
                                                        <small>{{ $reply->created_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i') }}</small>
                                                    </div>
                                                @endforeach
                                            </div>
                                        @endif
                                    </td>
                                    <td>{{ $comment->created_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i') }}</td>
                                    <td>
                                        <form action="{{ route('admin.replies.store') }}" method="POST" class="mt-2">
                                            @csrf
                                            <input type="hidden" name="comment_id" value="{{ $comment->id }}">
                                            <textarea name="content" class="form-control form-control-sm mb-2" rows="2" placeholder="Nhập trả lời..." required></textarea>
                                            <button type="submit" class="btn btn-sm btn-outline-primary">
                                                <i class="bi bi-reply"></i> Trả lời
                                            </button>
                                        </form>
                                    </td>
                                    <td>
                                        <form action="{{ route('admin.comments.destroy', $comment->id) }}" method="POST" class="d-inline">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-sm btn-outline-danger" onclick="return confirm('Bạn có chắc chắn muốn xóa bình luận này?')">
                                                <i class="bi bi-trash"></i> Xóa
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="text-center">Chưa có bình luận nào</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                    {{ $comments->links() }}
                </div>
            </div>
        </div>
    </div>
@endsection
