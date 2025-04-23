<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CommentController extends Controller
{
    public function index($productId)
    {
        try {
            $comments = Comment::where('product_id', $productId)
                ->with(['user' => function ($query) {
                    $query->select('id', 'name');
                }])
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($comments);
        } catch (\Exception $e) {
            Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json(['message' => 'Lỗi khi lấy bình luận'], 500);
        }
    }

    public function adminIndex(Request $request)
    {
        try {
            $comments = Comment::with([
                'product:id,product_name',
                'user:id,name',
                'replies' => function ($query) {
                    $query->with('user:id,name');
                }
            ])
                ->orderBy('id', 'desc')
                ->paginate(10);
            Log::info('Fetched comments for admin: ', ['count' => $comments->count()]);
            return view('admin.comments.index', compact('comments'));
        } catch (\Exception $e) {
            Log::error('Error fetching comments for admin: ' . $e->getMessage());
            return redirect()->route('admin.dashboard')->with('error', 'Lỗi khi lấy danh sách bình luận.');
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'content' => 'required|string|max:1000',
            ]);

            $userId = auth()->id();
            $today = Carbon::today()->toDateString();

            // Kiểm tra giới hạn bình luận
            $limit = CommentLimit::firstOrCreate(
                ['user_id' => $userId, 'date' => $today],
                ['comment_count' => 0]
            );

            if ($limit->comment_count >= 2) {
                return response()->json([
                    'message' => 'Bạn chỉ được bình luận 2 lần mỗi ngày!',
                    'remaining_comments' => 0
                ], 429);
            }

            // Tạo bình luận
            $comment = Comment::create([
                'product_id' => $validated['product_id'],
                'user_id' => $userId,
                'content' => $validated['content'],
            ]);

            // Tăng số lượng bình luận
            $limit->increment('comment_count');

            $comment->load('user:id,name');
            return response()->json([
                'comment' => $comment,
                'remaining_comments' => 2 - $limit->comment_count
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error adding comment: ' . $e->getMessage());
            return response()->json(['message' => 'Lỗi khi thêm bình luận'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $comment = Comment::findOrFail($id);
            $comment->delete();
            return redirect()->route('admin.comments.index')->with('success', 'Xóa bình luận thành công.');
        } catch (\Exception $e) {
            Log::error('Error deleting comment: ' . $e->getMessage());
            return redirect()->route('admin.comments.index')->with('error', 'Lỗi khi xóa bình luận.');
        }
    }

    public function apiDestroy($id)
    {
        try {
            $comment = Comment::findOrFail($id);

            if (auth()->id() !== $comment->user_id && auth()->user()->role_id !== 1) {
                return response()->json(['message' => 'Không có quyền xóa'], 403);
            }

            $comment->delete();
            return response()->json(['message' => 'Xóa bình luận thành công'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting comment: ' . $e->getMessage());
            return response()->json(['message' => 'Lỗi khi xóa bình luận'], 500);
        }
    }
}