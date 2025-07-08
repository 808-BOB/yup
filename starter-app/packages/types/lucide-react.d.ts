declare module "lucide-react" {
  import * as React from "react";

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  const icons: Record<string, LucideIcon>;

  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Plus: LucideIcon;
  export const User: LucideIcon;
  export const LogOut: LucideIcon;
  export const LogIn: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Palette: LucideIcon;
  export const Paintbrush: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Shield: LucideIcon;
  export const Calendar: LucideIcon;
  export const Clock: LucideIcon;
  export const MapPin: LucideIcon;
  export const Circle: LucideIcon;
  export const Share2: LucideIcon;
  export const Edit: LucideIcon;
  export const Copy: LucideIcon;
  export const Mail: LucideIcon;
  export const MessageSquare: LucideIcon;
  export default icons;
} 