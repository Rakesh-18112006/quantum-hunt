import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Info, Landmark, Megaphone, Menu, Mic, Users, X } from 'lucide-react';
import { useTheme } from '../../lib/useTheme';

const MENU_LINKS = [
  { label: 'Events', to: '/events', icon: CalendarDays },
  { label: 'Speakers', to: '/speakers', icon: Mic },
  { label: 'Guests', to: '/guests', icon: Users },
  { label: 'Team', to: '/team', icon: Users },
  { label: 'Refer and Earn', to: '/ambassadors', icon: Megaphone },
  { label: 'Collaborators', to: '/collaborators', icon: Landmark },
  { label: 'About', to: '/about', icon: Info },
];

/**
 * Hamburger button plus the right-hand drawer it opens.
 * `className` sets the breakpoint it hides at, e.g. `md:hidden`.
 */
const MobileMenu = ({ className = 'md:hidden' }: { className?: string }) => {
  const { theme } = useTheme();
  const onLight = theme === 'light';
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className={`${className} flex items-center justify-center w-10 h-10 shrink-0 rounded-full border transition-colors ${
          onLight
            ? 'border-[#F77FBE]/40 bg-white/80 text-[#b0306f] hover:bg-[#F77FBE]/10'
            : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
        }`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div key="mobile-menu" className={`${className} fixed inset-0 z-[100]`}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] }}
                className={`absolute right-0 top-0 flex h-[100dvh] w-[82%] max-w-sm flex-col border-l shadow-2xl font-poppins ${
                  onLight ? 'bg-white border-[#F77FBE]/30' : 'bg-[#0a0018] border-white/10'
                }`}
              >
                <div
                  className={`flex items-center justify-between px-5 py-4 border-b ${
                    onLight ? 'border-black/10' : 'border-white/10'
                  }`}
                >
                  <Link to="/" onClick={close} aria-label="Go to home page" className="flex items-center gap-3">
                    <img src="/assets/rgukt-logo.png" alt="RGUKT" className="h-10 w-10 object-contain" />
                    <span
                      className={`font-orbitron text-sm font-bold tracking-widest ${
                        onLight ? 'text-[#0b0b0f]' : 'text-white'
                      }`}
                    >
                      HOME
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close menu"
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      onLight ? 'text-[#b0306f] hover:bg-[#F77FBE]/10' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-2">
                  {MENU_LINKS.map(({ label, to, icon: Icon }, i) => {
                    const active = pathname === to || pathname.startsWith(`${to}/`);
                    return (
                      <motion.div
                        key={to}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + 0.04 * i }}
                      >
                        <Link
                          to={to}
                          onClick={close}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-4 px-6 py-4 font-orbitron text-base transition-colors ${
                            active
                              ? 'text-[#F77FBE] bg-[#F77FBE]/10'
                              : onLight
                                ? 'text-[#0b0b0f] hover:bg-[#F77FBE]/10'
                                : 'text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${onLight ? 'text-[#b0306f]' : 'text-[#F77FBE]'}`} />
                          {label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default MobileMenu;
