// thanh toán momo, cần đăng nhập trước khi thanh toán, có thể dùng thẻ nội địa hoặc thẻ quốc tế ( ưu tiên dùng thẻ quốc tế, vì quốc tế nghe oai hơn nội địa =)))))

// thẻ nội địa
No Tên Số thẻ Hạn ghi trên thẻ OTP Trường hợp test
1 NGUYEN VAN A 9704 0000 0000 0018 03/07 OTP Thành công
2 NGUYEN VAN A 9704 0000 0000 0026 03/07 OTP Thẻ bị khóa
3 NGUYEN VAN A 9704 0000 0000 0034 03/07 OTP Nguồn tiền không đủ
4 NGUYEN VAN A 9704 0000 0000 0042 03/07 OTP Hạn mức thẻ

// thẻ quốc tế để test
No Name Number Card Expdate CVC OTP Test Case
1 NGUYEN VAN A 5200 0000 0000 1096 05/25 111 OTP Card Successful
2 NGUYEN VAN A 5200 0000 0000 1104 05/25 111 OTP Card failed
2 NGUYEN VAN A 4111 1111 1111 1111 05/25 111 No OTP Card Successful

Ứng dụng sẽ yêu cầu nhập mã OTP. Mã này sẽ được đặt mặc định là 0000 hoặc 000000 trên App MoMo test.
