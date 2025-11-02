"use client";
import Navbar from "../components/Navbar";
import { useEffect, useState } from 'react';
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import CookieConsent from "react-cookie-consent";
import AdminConsole from "../components/AdminConsole";
import Cookies from 'js-cookie';
import { decodeJWT } from "../lib/jwtDecode";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        let admin = false;
        const userData = Cookies.get('sessionCookie');
            if (userData) {
              try{
                const parsedData = JSON.parse(userData);
                const decodedToken = decodeJWT(parsedData.token);
                if (decodedToken.payload) {
                  if (decodedToken.payload.admin === true) {
                    admin = true;
                    setToken(parsedData.token);
                  }
                }
              }catch (error) {
                admin = false;
                Cookies.remove('sessionCookie'); // Rimuovi il cookie se c'è un errore
              }
            }
        if (admin == false){
            setIsLoading(true);
            window.location.href = "/";
        }
      }, []);

    return (
      <div className="flex flex-col min-h-screen w-full">
        <LoadingScreen visible={isLoading} />
        <main className="flex-grow flex flex-col items-center justify-center bg-[#001F3F] w-full overflow-x-hidden text-white">
            <Navbar loadFunction={setIsLoading}/>
            <div className="flex flex-col lg:flex-row lg:w-3/4 w-5/6 my-35 justify-center">
                {token?<AdminConsole loadFunction={setIsLoading} token={token}/>:""}
            </div>
            <CookieConsent
            location="bottom"
            buttonText="Accetta tutti i cookie"
            declineButtonText="Usa solo cookie tecnici"
            enableDeclineButton
            cookieName="cookieConsent"
            style={{ background: "#2B373B" }}
            buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
            declineButtonStyle={{ color: "#fff", background: "#c00", fontSize: "13px" }}
            expires={150}
        >
            Utilizziamo i cookie per migliorare la tua esperienza.{" "}
            <a href="/cookiePolicy.pdf" style={{ color: "#fff", textDecoration: "underline" }}>
            Leggi la nostra cookie policy
            </a>.
        </CookieConsent>
        </main>
        <Footer/>
    </div>
    );
  }