@extends('admin.layouts.master')

@section('content')
    <style>
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .chat-container .card {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            overflow: hidden !important;
        }
        .chat-container .card-body {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 15px !important;
            max-height: 50vh !important;
        }
        .chat-container .card-footer {
            display: block !important;
            padding: 15px !important;
            background: #f8f9fa !important;
            border-top: 1px solid #dee2e6 !important;
            min-height: 60px !important;
        }
        .chat-container #message-form {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
        }
        .chat-container .input-group {
            display: flex !important;
            width: 100% !important;
            align-items: center !important;
        }
        .chat-container #message-input {
            flex: 1 !important;
            margin-right: 10px !important;
            height: 40px !important;
            display: block !important;
        }
        .chat-container #send-message {
            display: inline-block !important;
            height: 40px !important;
            padding: 0 20px !important;
        }
        .conversation-item.active {
            background-color: #e9ecef;
        }
        .message-item {
            word-break: break-word;
        }
    </style>

    <div class="container-xxl mt-4">
        <h2 class="mb-4">Quản lý Chat</h2>
        <div class="row" style="height: 70vh;">
            <!-- Danh sách conversation -->
            <div class="col-md-4 border-end">
                <h5>Danh sách Chat</h5>
                <div class="list-group" id="conversation-list">
                    @forelse($conversations as $conv)
                        <a
                            href="#"
                            class="list-group-item list-group-item-action conversation-item"
                            data-id="{{ $conv->id }}"
                            data-user-name="{{ $conv->user->name ?? 'Unknown' }}"
                        >
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">{{ $conv->user->name ?? 'Unknown' }}</h6>
                                @if(is_null($conv->admin_id))
                                    <span class="badge bg-danger rounded-pill">New</span>
                                @endif
                            </div>
                            <small class="message-preview">
                                @if($conv->messages->count() > 0)
                                    {{ Str::limit($conv->messages->last()->content, 30) }}
                                @else
                                    Chưa có tin nhắn
                                @endif
                            </small>
                        </a>
                    @empty
                        <p class="text-muted">Chưa có đoạn chat nào.</p>
                    @endforelse
                </div>
            </div>

            <!-- Khu vực tin nhắn -->
            <div class="col-md-8 chat-container">
                <h5>Tin nhắn</h5>
                <div class="card">
                    <div class="card-body" id="chat-messages">
                        <p class="text-muted text-center" id="chat-placeholder">Chọn một đoạn chat để xem tin nhắn.</p>
                    </div>
                    <div class="card-footer">
                        <form id="message-form" onsubmit="return false;">
                            @csrf
                            <div class="input-group">
                                <input type="hidden" id="conversation-id" value="">
                                <input
                                    type="text"
                                    id="message-input"
                                    class="form-control"
                                    placeholder="Nhập tin nhắn..."
                                    disabled
                                >
                                <button
                                    type="submit"
                                    class="btn btn-primary"
                                    id="send-message"
                                    disabled
                                >
                                    Gửi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Thêm Pusher và script -->
    @push('scripts')
    <script src="https://js.pusher.com/7.2/pusher.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                console.error('CSRF token not found');
                return;
            }
            console.log('CSRF Token:', csrfToken);

            // Elements
            const chatMessages = document.getElementById('chat-messages');
            const messageForm = document.getElementById('message-form');
            const conversationIdInput = document.getElementById('conversation-id');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-message');
            const conversationList = document.getElementById('conversation-list');
            if (!chatMessages || !messageForm || !conversationIdInput || !messageInput || !sendButton || !conversationList) {
                console.error('Required elements not found');
                return;
            }

            // Pusher config
            Pusher.logToConsole = true;
            const pusher = new Pusher('c1c7ff3f6141d637ab84', {
                cluster: 'ap1',
                forceTLS: true
            });

            pusher.connection.bind('connected', () => console.log('Pusher connected'));
            pusher.connection.bind('error', (err) => console.error('Pusher error:', err));

            // Auth
            const token = '{{ session("auth_token") ?? Auth::user()->createToken("auth_token")->plainTextToken }}';
            const userId = {{ Auth::id() }};
            console.log('Token:', token);
            console.log('User ID:', userId);

            let currentChannel = null;
            let currentConversationId = null;
            const displayedMessageIds = new Set();

            // Load tin nhắn
            const loadMessages = (conversationId) => {
                console.log('Loading messages for conversation:', conversationId);
                fetch(`/api/conversations/${conversationId}/messages`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    console.log('Fetch messages status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(messages => {
                    chatMessages.innerHTML = '';
                    displayedMessageIds.clear();
                    if (messages.length === 0) {
                        chatMessages.innerHTML = '<p class="text-muted text-center">Chưa có tin nhắn.</p>';
                        return;
                    }
                    messages.forEach(msg => {
                        appendMessage(msg, conversationId);
                    });
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                })
                .then(() => {
                    // Gán admin
                    fetch(`/api/conversations/${conversationId}/assign`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': csrfToken
                        },
                        body: JSON.stringify({ admin_id: userId })
                    })
                    .then(response => {
                        if (response.ok) {
                            console.log('Conversation assigned to admin:', userId);
                            const convItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
                            if (convItem) {
                                const badge = convItem.querySelector('.badge.bg-danger');
                                if (badge) badge.remove();
                            }
                        }
                    })
                    .catch(error => console.error('Error assigning conversation:', error));
                })
                .catch(error => {
                    console.error('Error fetching messages:', error);
                    chatMessages.innerHTML = `<p class="text-danger text-center">Lỗi: ${error.message}</p>`;
                });
            };

            // Append tin nhắn
            const appendMessage = (msg, conversationId) => {
                console.log('Appending message:', { id: msg.id, content: msg.content });
                if (displayedMessageIds.has(msg.id)) {
                    console.log('Duplicate message ignored:', msg.id);
                    return;
                }
                displayedMessageIds.add(msg.id);
                const div = document.createElement('div');
                div.className = `message-item ${msg.sender_id === userId ? 'text-end mb-2' : 'text-start mb-2'}`;
                div.setAttribute('data-message-id', msg.id);
                div.innerHTML = `
                    <small class="text-muted">${msg.sender?.name || 'Unknown'}</small>
                    <p class="bg-light p-2 rounded d-inline-block">${msg.content}</p>
                    <small class="d-block text-muted">${new Date(msg.created_at).toLocaleTimeString()}</small>
                `;
                chatMessages.appendChild(div);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                // Cập nhật preview
                const convItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
                if (convItem) {
                    const preview = convItem.querySelector('.message-preview');
                    if (preview) {
                        preview.textContent = msg.content.length > 30 ? msg.content.slice(0, 30) + '...' : msg.content;
                    }
                }
            };

            // Subscribe Pusher
            const subscribeChannel = (conversationId) => {
                if (currentChannel) {
                    pusher.unsubscribe(currentChannel);
                    console.log('Unsubscribed from:', currentChannel);
                    currentChannel = null;
                }
                currentChannel = `conversation.${conversationId}`;
                const channel = pusher.subscribe(currentChannel);
                const eventNames = ['MessageSent', 'App\\Events\\MessageSent', 'App\\Events\\MessageSent'];
                // Xóa binding cũ
                eventNames.forEach(eventName => {
                    channel.unbind(eventName);
                });
                // Bind mới
                eventNames.forEach(eventName => {
                    channel.bind(eventName, (data) => {
                        console.log(`Pusher received (${eventName}):`, data);
                        if (!data.message) {
                            console.error('Invalid Pusher data:', data);
                            return;
                        }
                        const msg = data.message;
                        if (currentConversationId !== msg.conversation_id.toString()) {
                            console.log('Message from different conversation, ignoring:', msg.conversation_id);
                            return;
                        }
                        appendMessage(msg, conversationId);
                    });
                });
                console.log('Subscribed to:', currentChannel);
                channel.bind('pusher:subscription_error', (err) => {
                    console.error('Subscription error:', err);
                    setTimeout(() => subscribeChannel(conversationId), 1000);
                });
            };

            // Gửi tin nhắn
            const sendMessage = () => {
                const conversationId = conversationIdInput.value;
                const content = messageInput.value.trim();
                if (!conversationId || !content) {
                    console.log('Invalid input:', { conversationId, content });
                    return;
                }

                console.log('Sending message:', { conversationId, content });
                fetch(`/api/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({ content })
                })
                .then(response => {
                    console.log('Send message status:', response.status);
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(`HTTP ${response.status}: ${err.error || 'Unknown error'}`);
                        });
                    }
                    return response.json();
                })
                .then(msg => {
                    console.log('Message sent:', msg);
                    messageInput.value = '';
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                    alert(`Lỗi gửi tin nhắn: ${error.message}`);
                });
            };

            // Xử lý chọn conversation
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const conversationId = this.getAttribute('data-id');
                    console.log('Selected conversation:', conversationId);
                    currentConversationId = conversationId;
                    conversationIdInput.value = conversationId;
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    loadMessages(conversationId);
                    subscribeChannel(conversationId);
                });
            });

            // Gửi tin nhắn
            sendButton.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });

            // Lắng nghe conversation mới
            const newConversationChannel = pusher.subscribe('new-conversation');
            newConversationChannel.bind('NewConversation', (data) => {
                console.log('New conversation created:', data);
                const conv = data.conversation;
                const convItem = document.createElement('a');
                convItem.className = 'list-group-item list-group-item-action conversation-item active';
                convItem.setAttribute('data-id', conv.id);
                convItem.setAttribute('data-user-name', conv.user?.name || 'Unknown');
                convItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${conv.user?.name || 'Unknown'}</h6>
                        <span class="badge bg-danger rounded-pill">New</span>
                    </div>
                    <small class="message-preview">Chưa có tin nhắn</small>
                `;
                conversationList.prepend(convItem);
                
                // Tự động chọn conversation mới
                currentConversationId = conv.id;
                conversationIdInput.value = conv.id;
                messageInput.disabled = false;
                sendButton.disabled = false;
                document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                convItem.classList.add('active');
                loadMessages(conv.id);
                subscribeChannel(conv.id);

                // Thêm event listener
                convItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    const conversationId = this.getAttribute('data-id');
                    currentConversationId = conversationId;
                    conversationIdInput.value = conversationId;
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    loadMessages(conversationId);
                    subscribeChannel(conversationId);
                });
            });
        });
    </script>
    @endpush
@endsection