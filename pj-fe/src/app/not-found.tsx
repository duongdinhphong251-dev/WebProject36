import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="container stack">
      <h1>Không tìm thấy nội dung</h1>
      <p>Spa hoặc voucher không tồn tại, hoặc hiện chưa được công khai.</p>
      <Link className="button" href="/vi">
        Về trang chủ
      </Link>
    </main>
  );
}
