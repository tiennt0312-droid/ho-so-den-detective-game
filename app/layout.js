export const metadata = {
  title: 'Hồ Sơ Đen — AI Detective Game',
  description: 'Trò chơi phá án tương tác với ba mức độ.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
