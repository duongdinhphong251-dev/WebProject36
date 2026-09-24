'use client';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) { return <html lang="vi"><body><main><h1>Đã có lỗi xảy ra</h1><button onClick={reset}>Thử lại</button></main></body></html>; }
