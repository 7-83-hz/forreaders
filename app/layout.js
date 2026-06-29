import './globals.css';

export const metadata = {
  title: 'presence',
  description: 'a room that fills as people arrive',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
