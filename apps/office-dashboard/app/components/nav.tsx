import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/waitlist', label: 'Waitlist' },
  { href: '/admin/devices', label: 'Admin Devices' },
];

export function Nav() {
  return (
    <nav className="flex flex-wrap gap-2 text-xs">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border px-3 py-1 text-muted-foreground transition hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
