@extends('admin.layouts.master')

@section('content')
    <style>
        /* Ép hiển thị form và nút gửi */
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
        }
        .chat-container .card-footer {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 15px !important;
            background: #f8f9fa !important;
            border-top: 1px solid #dee2e6 !important;
            min-height: 60px !important;
        }
        .chat-container #message-form {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        .chat-container .input-group {
            display: flex !important;
            width: 100% !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        .chat-container #message-input {
            flex: 1 !important;
            margin-right: 10px !important;
            height: 40px !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
        }
        .chat-container #send-message {
            display: inline-block !important;
            height: 40px !important;
            line-height: 40px !important;
            padding: 0 20px !important;
            visibility: visible !important;
            opacity: 1 !important;
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
                        >
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">{{ $conv->user->name }}</h6>
                                @if(is_null($conv->admin_id))
                                    <span class="badge bg-danger rounded-pill">New</span>
                                @endif
                            </div>
                            <small>
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
            // Kiểm tra CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                console.error('CSRF token not found in meta tag');
                return;
            }
            console.log('CSRF Token:', csrfToken);

            // Kiểm tra chat-messages element
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) {
                console.error('Element with ID "chat-messages" not found in DOM');
                return;
            }
            console.log('chat-messages element found:', chatMessages);

            // Kiểm tra form elements
            const messageForm = document.getElementById('message-form');
            const conversationIdInput = document.getElementById('conversation-id');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-message');
            if (!messageForm || !conversationIdInput || !messageInput || !sendButton) {
                console.error('Form elements not found:', {
                    messageForm: !!messageForm,
                    conversationIdInput: !!conversationIdInput,
                    messageInput: !!messageInput,
                    sendButton: !!sendButton
                });
                return;
            }
            console.log('Form elements found:', {
                messageForm, conversationIdInput, messageInput, sendButton
            });

            // Debug CSS của form
            console.log('Message Form Styles:', window.getComputedStyle(messageForm));
            console.log('Input Group Styles:', window.getComputedStyle(document.querySelector('.input-group')));
            console.log('Send Button Styles:', window.getComputedStyle(sendButton));

            // Cấu hình Pusher
            Pusher.logToConsole = true;
            const pusher = new Pusher('{{ env("PUSHER_APP_KEY") }}', {
                cluster: '{{ env("PUSHER_APP_CLUSTER") }}',
                forceTLS: true
            });

            // Kiểm tra Pusher kết nối
            pusher.connection.bind('connected', function() {
                console.log('Pusher connected successfully');
            });
            pusher.connection.bind('error', function(err) {
                console.error('Pusher connection error:', err);
            });

            const token = '{{ session("auth_token") ?? Auth::user()->createToken("auth_token")->plainTextToken }}';
            const userId = {{ Auth::id() }};
            let currentChannel = null;

            // Debug: Kiểm tra token và userId
            console.log('Token:', token);
            console.log('User ID:', userId);

            // Kiểm tra danh sách conversation
            const conversationList = document.getElementById('conversation-list');
            if (!conversationList) {
                console.error('Conversation list element not found');
                return;
            }
            const conversationItems = document.querySelectorAll('.conversation-item');
            console.log('Conversation Items:', conversationItems.length);

            // Lấy tin nhắn khi chọn conversation
            conversationItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const conversationId = this.getAttribute('data-id');
                    console.log('Selected Conversation ID:', conversationId);

                    // Cập nhật conversation ID và enable form
                    conversationIdInput.value = conversationId;
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    console.log('Form enabled, Conversation ID set to:', conversationIdInput.value);
                    console.log('messageInput disabled:', messageInput.disabled);
                    console.log('sendButton disabled:', sendButton.disabled);

                    // Debug CSS sau khi enable
                    console.log('Send Button Styles after enable:', window.getComputedStyle(sendButton));

                    // Active conversation
                    conversationItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');

                    // Lấy tin nhắn
                    console.log('Fetching messages for conversation:', conversationId);
                    fetch(`/api/conversations/${conversationId}/messages`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    })
                    .then(response => {
                        console.log('Fetch Messages Status:', response.status);
                        if (!response.ok) {
                            return response.json().then(err => {
                                throw new Error(`Failed to fetch messages: ${response.status} - ${err.error || 'Unknown error'}`);
                            });
                        }
                        return response.json();
                    })
                    .then(messages => {
                        console.log('Messages fetched:', messages);
                        if (!chatMessages) {
                            console.error('chatMessages is null during messages render');
                            return;
                        }
                        chatMessages.innerHTML = '';
                        if (messages.length === 0) {
                            chatMessages.innerHTML = '<p class="text-muted text-center">Chưa có tin nhắn.</p>';
                            return;
                        }
                        messages.forEach(msg => {
                            const div = document.createElement('div');
                            div.className = msg.sender_id === userId ? 'text-end mb-2' : 'text-start mb-2';
                            div.innerHTML = `
                                <small class="text-muted">${msg.sender.name}</small>
                                <p class="bg-light p-2 rounded d-inline-block">${msg.content}</p>
                                <small class="d-block text-muted">${new Date(msg.created_at).toLocaleTimeString()}</small>
                            `;
                            chatMessages.appendChild(div);
                        });
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    })
                    .catch(error => {
                        console.error('Error fetching messages:', error.message);
                        if (chatMessages) {
                            chatMessages.innerHTML = '<p class="text-danger text-center">Lỗi khi tải tin nhắn: ' + error.message + '</p>';
                        } else {
                            console.error('Cannot display error message: chatMessages is null');
                        }
                    });

                    // Hủy channel cũ và lắng nghe channel mới qua Pusher
                    if (currentChannel) {
                        pusher.unsubscribe(currentChannel);
                        console.log('Unsubscribed from channel:', currentChannel);
                    }
                    currentChannel = `conversation.${conversationId}`;
                    console.log('Subscribing to channel:', currentChannel);
                    const channel = pusher.subscribe(currentChannel);
                    channel.bind('MessageSent', function(data) {
                        console.log('New message received via Pusher:', data);
                        const msg = data.message;
                        if (!chatMessages) {
                            console.error('chatMessages is null during Pusher message render');
                            return;
                        }
                        const div = document.createElement('div');
                        div.className = msg.sender_id === userId ? 'text-end mb-2' : 'text-start mb-2';
                        div.innerHTML = `
                            <small class="text-muted">${msg.sender.name}</small>
                            <p class="bg-light p-2 rounded d-inline-block">${msg.content}</p>
                            <small class="d-block text-muted">${new Date(msg.created_at).toLocaleTimeString()}</small>
                        `;
                        chatMessages.appendChild(div);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    });
                });
            });

            // Gửi tin nhắn
            const sendMessage = () => {
                const conversationId = conversationIdInput.value;
                const content = messageInput.value;
                if (!conversationId || !content.trim()) {
                    console.log('Conversation ID or message content is empty:', { conversationId, content });
                    return;
                }

                console.log('Sending message to conversation:', conversationId, 'Content:', content);
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
                    console.log('Send Message Status:', response.status);
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(`Failed to send message: ${response.status} - ${err.error || 'Unknown error'}`);
                        });
                    }
                    return response.json();
                })
                .then(msg => {
                    console.log('Message sent:', msg);
                    messageInput.value = '';
                })
                .catch(error => {
                    console.error('Error sending message:', error.message);
                    alert('Lỗi khi gửi tin nhắn: ' + error.message);
                });
            };

            // Gửi tin nhắn bằng nút "Gửi"
            sendButton.addEventListener('click', function() {
                console.log('Send button clicked');
                sendMessage();
            });

            // Gửi tin nhắn bằng Enter
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed');
                    sendMessage();
                }
            });
        });
    </script>
    @endpush
@endsection