<?php

namespace App\Http\Controllers;

use App\Models\Reply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReplyController extends Controller
{
    public function adminStore(Request $request)
    {
        try {
            $validated = $request->validate([
                'comment_id' => 'required|exists:comments,id',
                'content' => 'required|string|max:1000',
            ]);

            if (auth()->user()->role_id !== 1) {
                return redirect()->route('admin.comments.index')->with('error', 'Chỉ admin mới có thể trả lời.');
            }

            $reply = Reply::create([
                'comment_id' => $validated['comment_id'],
                'user_id' => auth()->id(),
                'content' => $validated['content'],
            ]);

            return redirect()->route('admin.comments.index')->with('success', 'Trả lời thành công.');
        } catch (\Exception $e) {
            Log::error('Error adding admin reply: ' . $e->getMessage());
            return redirect()->route('admin.comments.index')->with('error', 'Lỗi khi thêm trả lời.');
        }
    }
}