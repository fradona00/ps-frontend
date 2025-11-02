import HomePageComponent from "./components/HomePageComponent";

export const metadata = {
    title: 'Home | PlanetSoccer&Padel',
    description: 'Prenota velocemente la tua partita!',
    openGraph: {
        title: 'Home | PlanetSoccer&Padel',
        description: 'Prenota velocemente la tua partita!',
        url: 'https://www.planetsoccerpadel.it',
        siteName: 'PlanetSoccer&Padel',
        type: 'website',
    },
};

export default function HomePage() {
    
    return (
        <HomePageComponent/>
    );
  }