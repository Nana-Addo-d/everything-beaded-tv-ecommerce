import { Geist, Geist_Mono } from "next/font/google";

import "@workspace/ui/styles/globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { StoreChrome } from "@/components/layout/store-chrome";
import { CartProvider } from "@/features/cart/cart-provider";
import { getCatalog } from "@/features/catalog/catalog-server";
import { paymentMode, paymentConfigured } from "@/features/commerce/config";

export const metadata = {
  title: "Everything Beaded & Trading Ventures",
  description: "Explore the Everything Beaded collection.",
};

export const dynamic = "force-dynamic";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <CartProvider
            validSlugs={(await getCatalog()).map((product) => product.slug)}
          >
            <a
              href="#store-content"
              className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-background p-3 focus:not-sr-only"
            >
              Skip to content
            </a>
            <StoreChrome>
              <Header />
            </StoreChrome>
            {paymentConfigured() && paymentMode() === "test" && (
              <p className="border-b bg-muted/50 px-4 py-2 text-center text-xs">
                Test payments enabled · No live payment will be taken
              </p>
            )}
            <div id="store-content" tabIndex={-1}>
              {children}
            </div>
            <StoreChrome>
              <Footer />
            </StoreChrome>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
