<?php
namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        $channel = 'conversation.' . $this->message->conversation_id;
        Log::info('Broadcasting on channel', ['channel' => $channel]);
        return new Channel($channel);
    }

    public function broadcastWith()
    {
        $data = [
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_id' => $this->message->sender_id,
                'content' => $this->message->content,
                'created_at' => $this->message->created_at->toISOString(),
                'sender' => [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name ?? 'Unknown',
                    'image_user' => $this->message->sender->image_user,
                ],
            ],
        ];
        Log::info('Broadcasting MessageSent event', [
            'channel' => 'conversation.' . $this->message->conversation_id,
            'event' => 'MessageSent',
            'data' => $data
        ]);
        return $data;
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }
}