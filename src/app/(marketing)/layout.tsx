import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen">{children}</main>
      <LandingFooter />
    </>
  );
}
