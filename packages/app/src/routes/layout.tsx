import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

const NAV_ITEMS = [
  { href: '/', label: 'Today', icon: '\u2609' },
  { href: '/calendar/', label: 'Calendar', icon: '\u{1F4C5}' },
  { href: '/events/', label: 'Events', icon: '\u2728' },
  { href: '/masa/', label: 'Masa List', icon: '\u{1F319}' },
  { href: '/settings/', label: 'Settings', icon: '\u2699' },
];

export default component$(() => {
  const loc = useLocation();

  return (
    <div class="flex min-h-screen">
      {/* Sidebar */}
      <nav class="w-56 bg-amber-900 text-amber-50 flex flex-col shrink-0">
        <div class="p-4 border-b border-amber-800">
          <h1 class="text-lg font-bold tracking-wide">Gaurabda</h1>
          <p class="text-xs text-amber-300">Vedic Calendar</p>
        </div>
        <div class="flex-1 py-2">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/'
              ? loc.url.pathname === '/'
              : loc.url.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                class={[
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-amber-800 text-white font-medium'
                    : 'text-amber-200 hover:bg-amber-800/50 hover:text-white',
                ]}
              >
                <span class="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div class="p-4 text-xs text-amber-400 border-t border-amber-800">
          @gaurabda/core v1.0
        </div>
      </nav>

      {/* Main content */}
      <main class="flex-1 p-6 overflow-auto">
        <Slot />
      </main>
    </div>
  );
});
