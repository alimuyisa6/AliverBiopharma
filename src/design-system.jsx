/**
 * Aliver Biopharma — centralized UI controls.
 * Keep shared icon names and Tailwind class contracts here; component-specific
 * layout can remain local. Tailwind v4 scans these literal class strings.
 */
import {
  ArrowUpRight, ArrowRight, ArrowUp, ArrowDown, Check, X, Menu, Search, Home, BookOpen,
  GraduationCap, FlaskConical, Heart, User, Settings, Bell, Calendar,
  Clock, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, AlertCircle,
  Info, CircleHelp, Loader2, Eye, EyeOff, Mail, Phone, MapPin, Star,
  Sparkles, Plus, Minus, Edit, Trash2, Download, Upload, ExternalLink,
  Lock, Unlock, ShieldCheck, FileText, Play, Pause, RefreshCw, Send,
  MessageCircle, Bookmark, BookmarkCheck, ChartNoAxesCombined, Trophy,
  Target, Zap, Stethoscope, Pill, Microscope, Atom, Brain, Lightbulb,
  Sun, Moon, LogOut, Copy, Share2, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, Circle, CircleCheck, Route, Rocket, Flame, Medal, ClipboardCheck, ListChecks,
  Grid2X2, List, Users, TriangleAlert, UserPen, MessageSquare, ChartLine, ChartPie, MailCheck,
  Bitcoin, Smartphone, CalendarClock, Layers, Expand, RotateCcw, IdCard, Pencil,
  KeyRound, Fingerprint, Laptop, SlidersHorizontal, Gift, CreditCard, Award, Terminal,
  Webhook, Filter, Flag
} from 'lucide-react';
import { FaEnvelope, FaLocationDot, FaLinkedinIn, FaXTwitter, FaInstagram, FaGlobe, FaFacebook, FaYoutube, FaWhatsapp } from 'react-icons/fa6';

export const ICONS = Object.freeze({
  arrowUpRight: ArrowUpRight, arrowRight: ArrowRight, arrowUp: ArrowUp, arrowDown: ArrowDown, check: Check, close: X,
  menu: Menu, search: Search, home: Home, book: BookOpen, graduation: GraduationCap,
  science: FlaskConical, heart: Heart, user: User, settings: Settings, bell: Bell,
  calendar: Calendar, clock: Clock, chevronDown: ChevronDown, chevronLeft: ChevronLeft,
  chevronRight: ChevronRight, chevronUp: ChevronUp, alert: AlertCircle, info: Info,
  help: CircleHelp, loading: Loader2, eye: Eye, eyeOff: EyeOff, mail: Mail, phone: Phone,
  location: MapPin, star: Star, sparkles: Sparkles, add: Plus, remove: Minus, edit: Edit,
  delete: Trash2, download: Download, upload: Upload, external: ExternalLink, lock: Lock,
  unlock: Unlock, security: ShieldCheck, document: FileText, play: Play, pause: Pause,
  refresh: RefreshCw, send: Send, chat: MessageCircle, bookmark: Bookmark,
  bookmarked: BookmarkCheck, analytics: ChartNoAxesCombined, trophy: Trophy, target: Target,
  energy: Zap, health: Stethoscope, pharmacy: Pill, microscope: Microscope, atom: Atom,
  brain: Brain, idea: Lightbulb, sun: Sun, moon: Moon, logout: LogOut, copy: Copy,
  share: Share2, success: CheckCircle2, failure: XCircle, warning: AlertTriangle,
  emailBrand: FaEnvelope, locationPin: FaLocationDot, linkedinBrand: FaLinkedinIn,
  xBrand: FaXTwitter, instagramBrand: FaInstagram, websiteBrand: FaGlobe,
  facebookBrand: FaFacebook, youtubeBrand: FaYoutube, whatsappBrand: FaWhatsapp,
  arrowLeft: ArrowLeft, circle: Circle, route: Route, rocket: Rocket, flame: Flame,
  medal: Medal, clipboardCheck: ClipboardCheck, listChecks: ListChecks, grid: Grid2X2,
  users: Users, list: List, userPen: UserPen, message: MessageSquare, chartLine: ChartLine,
  chartPie: ChartPie, mailCheck: MailCheck, bitcoin: Bitcoin, smartphone: Smartphone,
  calendarClock: CalendarClock, layers: Layers, expand: Expand, rotate: RotateCcw,
  idCard: IdCard, pencil: Pencil, key: KeyRound, fingerprint: Fingerprint, laptop: Laptop,
  sliders: SlidersHorizontal, gift: Gift, creditCard: CreditCard, award: Award,
  terminal: Terminal, webhook: Webhook, filter: Filter, flag: Flag, clipboard: ClipboardCheck
});

export const ICON_ALIASES = Object.freeze({
  'envelope': 'mail', 'email': 'mail', 'email-address': 'mail', 'arrow-left': 'arrowLeft', 'arrow-right': 'arrowRight', 'arrow-up-right': 'arrowUpRight',
  'user-graduate': 'graduation', 'triangle-exclamation': 'warning', 'route': 'route',
  'circle-check': 'success', 'rocket': 'rocket', 'trophy': 'trophy', 'fire': 'flame',
  'medal': 'medal', 'microscope': 'microscope', 'bullseye': 'target', 'audience': 'users',
  'review': 'message', 'bitcoin': 'bitcoin', 'mobile-money': 'smartphone',
  'circle-info': 'info', 'heart': 'heart', 'clipboard-check': 'clipboardCheck',
  'book-open': 'book', 'list-check': 'listChecks', 'star': 'star', 'grid': 'grid',
  'list': 'list', 'exclamation-triangle': 'warning', 'user-pen': 'userPen', 'user': 'user',
  'users': 'users', 'clock': 'clock', 'file-lines': 'document', 'chevron-right': 'chevronRight',
  'circle-xmark': 'failure', 'comment': 'chat', 'book-open-reader': 'book',
  'chart-line': 'chartLine', 'envelope-circle': 'mailCheck', 'alert-circle': 'alert',
  'facebook': 'facebookBrand', 'x-twitter': 'xBrand', 'linkedin': 'linkedinBrand',
  'whatsapp': 'whatsappBrand', 'xmark': 'close', 'chart-pie': 'chartPie',
  'calendar-clock': 'calendarClock', 'layer-group': 'layers', 'expand': 'expand',
  'paper-plane': 'send', 'rotate': 'rotate', 'home': 'home', 'profile-sections': 'sliders',
  'id-card': 'idCard', 'pen': 'pencil', 'bell': 'bell', 'key': 'key',
  'fingerprint': 'fingerprint', 'laptop': 'laptop', 'sliders': 'sliders', 'gift': 'gift',
  'user-group': 'users', 'credit-card': 'creditCard', 'award': 'award', 'terminal': 'terminal',
  'webhook': 'webhook', 'shield': 'security', 'magnifying-glass': 'search', 'filter': 'filter',
  'bookmark': 'bookmark', 'trash': 'delete', 'check': 'check', 'chevron-left': 'chevronLeft',
  'capsules': 'pharmacy', 'lock': 'lock', 'plus': 'add', 'calendar': 'calendar',
  'circle': 'circle', 'flag': 'flag'
});

export const ICON_SIZE = Object.freeze({ xs: 14, sm: 16, md: 20, lg: 24, xl: 32 });

export function Icon({ name, size = 'md', className = '', strokeWidth = 2, ...props }) {
  const Component = ICONS[ICON_ALIASES[name] || name] || CircleHelp;
  const resolvedSize = typeof size === 'number' ? size : (ICON_SIZE[size] || ICON_SIZE.md);
  return <Component size={resolvedSize} strokeWidth={strokeWidth} className={className} aria-hidden={props['aria-label'] ? undefined : true} {...props} />;
}

/** Reusable Tailwind v4 class contracts. Keep class names literal for scanning. */
export const UI = Object.freeze({
  page: 'mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-9 lg:px-8',
  section: 'min-w-0 space-y-6',
  card: 'min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6',
  cardTitle: 'text-lg font-bold tracking-tight text-slate-900',
  body: 'text-sm leading-6 text-slate-700',
  muted: 'text-sm leading-6 text-slate-600',
  label: 'text-sm font-semibold text-slate-800',
  input: 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200',
  button: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
  primaryButton: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-800 bg-primary-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:opacity-60',
  secondaryButton: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:opacity-60',
  dangerButton: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-800 bg-red-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60',
  hero: {
    section: 'relative isolate w-full overflow-hidden bg-primary-50 text-slate-900',
    container: 'mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-12 lg:py-24',
    heading: 'max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-primary-900 sm:text-5xl lg:text-6xl xl:text-7xl',
    accent: 'mt-2 block text-primary-700',
    description: 'mt-6 max-w-xl text-base leading-8 text-slate-700 sm:text-lg',
    imageFrame: 'relative isolate min-h-[320px] overflow-hidden rounded-[2rem] border border-white bg-primary-100 shadow-2xl sm:min-h-[440px]',
  },
  status: {
    success: 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900',
    warning: 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950',
    error: 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900',
    info: 'rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-900',
  },
});

export function getIconNameFromClass(iconClass = '') {
  const normalized = String(iconClass).toLowerCase();
  if (normalized.includes('facebook')) return 'facebookBrand';
  if (normalized.includes('instagram')) return 'instagramBrand';
  if (normalized.includes('linkedin')) return 'linkedinBrand';
  if (normalized.includes('twitter') || normalized.includes('x-twitter')) return 'xBrand';
  if (normalized.includes('youtube')) return 'youtubeBrand';
  if (normalized.includes('whatsapp')) return 'whatsappBrand';
  if (normalized.includes('envelope') || normalized.includes('email')) return 'emailBrand';
  if (normalized.includes('location') || normalized.includes('map-marker')) return 'locationPin';
  return 'websiteBrand';
}
