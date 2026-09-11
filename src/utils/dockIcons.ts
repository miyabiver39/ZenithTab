import type { ElementType } from 'react';
import {
  Globe,
  Code2,
  Video,
  Mail,
  Sparkles,
  Terminal,
  Music,
  Camera,
  BookOpen,
  Heart,
  Star,
  Folder,
  ShoppingCart,
  MessageCircle,
  Calendar,
  FileText,
  Cloud,
  Newspaper,
  Gamepad2,
  Wallet,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

/**
 * Curated icon set for Quick Dock items. Users can also type any free-form
 * emoji/short string as a custom icon; anything not found here is rendered
 * as literal text instead of a Lucide icon.
 */
export const DOCK_ICON_LIBRARY: Record<string, ElementType> = {
  globe: Globe,
  code: Code2,
  video: Video,
  mail: Mail,
  sparkles: Sparkles,
  terminal: Terminal,
  music: Music,
  camera: Camera,
  book: BookOpen,
  heart: Heart,
  star: Star,
  folder: Folder,
  cart: ShoppingCart,
  chat: MessageCircle,
  calendar: Calendar,
  document: FileText,
  cloud: Cloud,
  news: Newspaper,
  game: Gamepad2,
  wallet: Wallet,
  study: GraduationCap,
  work: Briefcase,
};

export const DOCK_ICON_KEYS = Object.keys(DOCK_ICON_LIBRARY);
