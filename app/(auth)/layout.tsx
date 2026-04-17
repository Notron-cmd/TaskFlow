export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen bg-[#0F0F1A] flex items-center justify-center"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 65% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)',
      }}
    >
      {children}
    </div>
  )
}
