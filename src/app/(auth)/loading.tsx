export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-in fade-in duration-500">
        <div className="mx-auto mb-6 h-12 w-12 rounded-xl bg-(--brand-primary) flex items-center justify-center animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
          </svg>
        </div>
        <p className="text-sm text-(--color-text-muted)">Loading...</p>
      </div>
    </div>
  )
}
