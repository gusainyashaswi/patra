// Minimal 1.5px-stroke icon set (Lucide-style geometry), no dependency.
// Decorative by default (aria-hidden); pair with visible text or an aria-label on the parent.

function Svg({ size = 16, className = "", children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Home: (p) => <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></Svg>,
  Send: (p) => <Svg {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></Svg>,
  Layout: (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></Svg>,
  Users: (p) => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>,
  Settings: (p) => <Svg {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Svg>,
  Plus: (p) => <Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>,
  Search: (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>,
  Check: (p) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>,
  CheckCircle: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 5-5" /></Svg>,
  Circle: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /></Svg>,
  X: (p) => <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>,
  Alert: (p) => <Svg {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Svg>,
  Info: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Svg>,
  ChevronRight: (p) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>,
  ChevronLeft: (p) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>,
  ChevronDown: (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>,
  ArrowUp: (p) => <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>,
  ArrowDown: (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>,
  ArrowRight: (p) => <Svg {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></Svg>,
  Trash: (p) => <Svg {...p}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Svg>,
  Copy: (p) => <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Svg>,
  Upload: (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></Svg>,
  Download: (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></Svg>,
  File: (p) => <Svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></Svg>,
  Mail: (p) => <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Svg>,
  Server: (p) => <Svg {...p}><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01" /><path d="M7 17.5h.01" /></Svg>,
  Globe: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></Svg>,
  AtSign: (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></Svg>,
  Type: (p) => <Svg {...p}><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></Svg>,
  Image: (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></Svg>,
  Button: (p) => <Svg {...p}><rect x="3" y="7" width="18" height="10" rx="5" /><path d="M8 12h8" /></Svg>,
  Divider: (p) => <Svg {...p}><path d="M3 12h18" /><path d="M8 7h8" opacity=".4" /><path d="M8 17h8" opacity=".4" /></Svg>,
  Spacer: (p) => <Svg {...p}><path d="M12 3v18" /><path d="m8 7 4-4 4 4" /><path d="m8 17 4 4 4-4" /></Svg>,
  Eye: (p) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>,
  Monitor: (p) => <Svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></Svg>,
  Phone: (p) => <Svg {...p}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></Svg>,
  Sun: (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>,
  Moon: (p) => <Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></Svg>,
  Menu: (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>,
  LogOut: (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>,
  Pause: (p) => <Svg {...p}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Svg>,
  Play: (p) => <Svg {...p}><path d="M7 4v16l13-8z" /></Svg>,
  Braces: (p) => <Svg {...p}><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" /><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" /></Svg>,
  Key: (p) => <Svg {...p}><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></Svg>,
  Shield: (p) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></Svg>,
  Loader: (p) => <Svg {...p} className={`animate-spin ${p?.className ?? ""}`}><path d="M21 12a9 9 0 1 1-6.2-8.6" /></Svg>,
  MoreH: (p) => <Svg {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Svg>,
  Grip: (p) => <Svg {...p}><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></Svg>,
  Sparkle: (p) => <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Svg>,
};

// Patra wordmark: heavy display type in the accent, like the reference's FILEDROP mark.
export function Logo({ size = 26, className = "" }) {
  return (
    <span
      className={`display select-none text-accent ${className}`}
      style={{ fontSize: size, letterSpacing: "-0.05em", lineHeight: 1 }}
    >
      PATRA
    </span>
  );
}
