import "./globals.css"; // Importa il CSS globale


export const metadata = {
  title: 'PlanetSoccer&Padel',
  description: 'Esplora i nostri campi da Padel e Calcio a 5, prenota la tua partita in pochi click!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
       <meta name="viewport" content="width=device-width" />
       <head >
              {/* Favicon base */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />

      {/* Apple devices */}
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Android Chrome */}
      <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

      {/* Manifest (opzionale per PWA) */}
      <link rel="manifest" href="/site.webmanifest" />
       <script src="https://accounts.google.com/gsi/client" async defer></script>
        <style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Oswald:wght@200..700&display=swap');
</style></head>
      <body className="font-[montserrat]">
        {children}
      </body>
    </html>
  )
}
