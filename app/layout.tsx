import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Academia Irisarri — Chat Jurídico",
    description: "Consultas de derecho penal con el criterio del Dr. Santiago M. Irisarri",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
          <html lang="es">
                <body>{children}</body>body>
          </html>html>
        );
}</html>
