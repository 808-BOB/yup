import { BrandingProvider } from "@/contexts/BrandingContext";
import Header from "./header";

export default function HeaderWithBranding() {
  return (
    <BrandingProvider>
      <Header />
    </BrandingProvider>
  );
}