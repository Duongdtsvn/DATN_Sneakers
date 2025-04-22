<?php
namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function adminIndex()
    {
        $conversations = Conversation::with(['user', 'messages' => function ($query) {
            $query->latest()->take(1)->with('sender');
        }])->get();
        return view('admin.chats.index', compact('conversations'));
    }

    public function getMessages($conversationId)
    {
        $user = Auth::user();
        $conversation = Conversation::findOrFail($conversationId);

        if ($user->role_id == 3 && $conversation->user_id != $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        } elseif ($user->role_id != 3 && $conversation->admin_id != $user->id && $conversation->admin_id !== null) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($user->role_id != 3 && $conversation->admin_id === null) {
            $conversation->admin_id = $user->id;
            $conversation->save();
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with('sender')
            ->get();

        Log::info('Fetched messages for conversation', [
            'conversation_id' => $conversationId,
            'user_id' => $user->id,
            'message_count' => $messages->count()
        ]);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, $conversationId)
    {
        try {
            $user = Auth::user();
            $conversation = Conversation::findOrFail($conversationId);

            if ($user->role_id == 3 && $conversation->user_id != $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            } elseif ($user->role_id != 3 && $conversation->admin_id != $user->id && $conversation->admin_id !== null) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $content = $request->input('content');
            if (empty(trim($content))) {
                return response()->json(['error' => 'Message content cannot be empty'], 400);
            }

            $message = new Message();
            $message->conversation_id = $conversationId;
            $message->sender_id = $user->id;
            $message->content = $content;
            $message->save();

            $message->load('sender');

            Log::info('Message saved and event triggered', [
                'conversation_id' => $conversationId,
                'message_id' => $message->id,
                'sender_id' => $message->sender_id,
                'sender_role' => $user->role_id == 3 ? 'user' : 'admin',
                'content' => $message->content,
                'channel' => 'conversation.' . $conversationId
            ]);

            event(new MessageSent($message));

            return response()->json($message);
        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage(), [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'content' => $request->input('content'),
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function getOrCreateConversation(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized: User not authenticated'], 401);
            }

            if ($user->role_id != 3) {
                return response()->json(['error' => 'Unauthorized: Only users can create conversations'], 403);
            }

            // Kiểm tra xem user đã có conversation chưa
            $conversation = Conversation::where('user_id', $user->id)->first();

            if ($conversation) {
                Log::info('Existing conversation found', [
                    'user_id' => $user->id,
                    'conversation_id' => $conversation->id
                ]);
                return response()->json($conversation);
            }

            // Tạo conversation mới nếu chưa có
            $conversation = new Conversation();
            $conversation->user_id = $user->id;
            $conversation->status = 'open';
            $conversation->save();

            Log::info('New conversation created', [
                'user_id' => $user->id,
                'conversation_id' => $conversation->id
            ]);

            event(new \App\Events\NewConversation($conversation));

            return response()->json($conversation);
        } catch (\Exception $e) {
            Log::error('Error creating conversation: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function getConversations(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized: User not authenticated'], 401);
            }

            $conversations = Conversation::where('user_id', $user->id)
                ->with(['messages' => function ($query) {
                    $query->latest()->take(3)->with('sender');
                }])
                ->get();

            Log::info('Fetched conversations for user', [
                'user_id' => $user->id,
                'conversation_count' => $conversations->count()
            ]);

            return response()->json($conversations);
        } catch (\Exception $e) {
            Log::error('Error fetching conversations: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function assignConversation(Request $request, $conversationId)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role_id == 3) {
                return response()->json(['error' => 'Unauthorized: Only admins can assign conversations'], 403);
            }

            $conversation = Conversation::findOrFail($conversationId);
            $conversation->admin_id = $user->id;
            $conversation->save();

            Log::info('Conversation assigned to admin', [
                'conversation_id' => $conversationId,
                'admin_id' => $user->id
            ]);

            return response()->json(['message' => 'Conversation assigned successfully']);
        } catch (\Exception $e) {
            Log::error('Error assigning conversation: ' . $e->getMessage(), [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
}