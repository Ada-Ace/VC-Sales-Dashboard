import './globals.css';

export const metadata = {
    title: 'VC Sales Dashboard',
    description: 'AI-Powered Business Intelligence',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
                {children}
            </body>
        </html>
    );
}
