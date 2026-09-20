import "./globals.css";

export const metadata = {
  title: "Petory",
  description: "A community for pet owners and their pets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
