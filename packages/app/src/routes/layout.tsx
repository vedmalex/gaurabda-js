import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

const NAV_ITEMS = [
  { href: '/', label: 'Today', icon: '\u2609' },
  { href: '/calendar/', label: 'Calendar', icon: '\u{1F4C5}' },
  { href: '/events/', label: 'Events', icon: '\u2728' },
  { href: '/masa/', label: 'Masa', icon: '\u{1F319}' },
  { href: '/muhurta/', label: 'Muhurta', icon: '\u2606' },
  { href: '/search/', label: 'Search', icon: '\u{1F50D}' },
  { href: '/settings/', label: 'Settings', icon: '\u2699' },
];

export default component$(() => {
  const loc = useLocation();

  const isActive = (href: string) =>
    href === '/' ? loc.url.pathname === '/' : loc.url.pathname.startsWith(href);

  return (
    <div class="flex flex-col md:flex-row min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <nav class="hidden md:flex w-56 bg-amber-900 text-amber-50 flex-col shrink-0">
        <div class="p-4 border-b border-amber-800">
          <h1 class="text-lg font-bold tracking-wide">Gaurabda</h1>
          <p class="text-xs text-amber-300">Vedic Calendar</p>
        </div>
        <div class="flex-1 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              class={[
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-amber-800 text-white font-medium'
                  : 'text-amber-200 hover:bg-amber-800/50 hover:text-white',
              ]}
            >
              <span class="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
        <div class="p-4 text-xs text-amber-400 border-t border-amber-800">
          @gaurabda/core v1.0
        </div>
      </nav>

      {/* Main content */}
      <main class="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
        <Slot />
      </main>

      {/* Mobile bottom tabs — hidden on desktop */}
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex safe-area-bottom z-50">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            class={[
              'flex-1 flex flex-col items-center py-2 text-[10px] transition-colors min-h-[56px] justify-center',
              isActive(item.href)
                ? 'text-amber-700 font-semibold'
                : 'text-stone-400',
            ]}
          >
            <span class="text-xl leading-none mb-0.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
});
