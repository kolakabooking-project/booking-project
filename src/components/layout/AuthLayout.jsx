
export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/kpp-building.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,25,65,0.92),rgba(23,44,104,0.82),rgba(15,23,42,0.86))] dark:bg-[linear-gradient(135deg,rgba(3,8,19,0.94),rgba(11,24,48,0.9),rgba(15,23,42,0.96))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,201,27,0.22),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_20%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,201,27,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(142,164,255,0.12),transparent_20%)]" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full border border-white/10 bg-djp-yellow/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center overflow-y-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full max-w-[1680px]">

          <div className="grid w-full items-center gap-8 sm:gap-12 lg:grid-cols-2">
            <section className="flex flex-col mb-8 lg:mb-0 lg:justify-center lg:pr-8 xl:pr-16 items-center lg:items-start">
              <div className="max-w-fit flex flex-col items-center lg:items-start gap-3 lg:gap-4 text-center lg:text-left">
                <img
                  src="/logo.png"
                  alt="Logo BOOKOLAKA"
                  className="w-auto h-16 sm:h-20 lg:h-24 object-contain lg:object-left drop-shadow-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'%3E%3Crect width='240' height='80' rx='12' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgba(255,255,255,0.6)'%3ELogo (Landscape)%3C/text%3E%3C/svg%3E";
                  }}
                />

                <h1 className="mt-2 text-xl sm:text-3xl md:text-4xl xl:text-[3.25rem] font-heading font-extrabold leading-[1.15] text-white drop-shadow-md tracking-tight lg:whitespace-nowrap">
                  BOOKOLAKA - Smart Booking System
                </h1>

                <p className="mt-2 text-sm sm:text-lg xl:text-2xl leading-relaxed text-white/80 font-medium drop-shadow-sm">
                  Sentralisasi layanan peminjaman fasilitas kantor.
                </p>
              </div>
            </section>

            <div className="mx-auto w-full max-w-md lg:ml-auto lg:max-w-[420px] xl:max-w-[480px] animate-fade-in">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
