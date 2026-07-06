export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="invoice-page-shell">
      <main className="invoice-page-main">{children}</main>
    </div>
  );
}
