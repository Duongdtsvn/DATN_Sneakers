<?php
namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NewConversation implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversation;

    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation;
    }

    public function broadcastOn()
    {
        $channel = 'new-conversation';
        Log::info('Broadcasting on channel', ['channel' => $channel]);
        return new Channel($channel);
    }

    public function broadcastWith()
    {
        $data = [
            'conversation' => [
                'id' => $this->conversation->id,
                'user_id' => $this->conversation->user_id,
                'user' => [
                    'id' => $this->conversation->user->id,
                    'name' => $this->conversation->user->name ?? 'Unknown',
                    'image_user' => $this->conversation->user->image_user,
                ],
                'admin_id' => $this->conversation->admin_id,
                'status' => $this->conversation->status,
            ],
        ];
        Log::info('Broadcasting NewConversation event', [
            'channel' => 'new-conversation',
            'event' => 'NewConversation',
            'data' => $data
        ]);
        return $data;
    }

    public function broadcastAs()
    {
        return 'NewConversation';
    }
}