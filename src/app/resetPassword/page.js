"use client";
import Navbar from "../components/Navbar";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ResetPasswordForm from "../components/ResetPasswordForm";
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import CookieConsent from "react-cookie-consent";
export default function ResetPasswordPage() {
    const router = useRouter();
    const [query, setQuery] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (router.isReady) {
          setQuery(router.query.value);
        }
      }, [router.isReady]);

    return (
      <div className="flex flex-col min-h-screen w-full">
        <LoadingScreen visible={isLoading} />
      <main className="flex-grow flex flex-col items-center justify-center bg-[#001F3F] w-full overflow-x-hidden text-white">
          <Navbar loadFunction={setIsLoading}/>
          <div className="flex flex-col lg:flex-row lg:w-3/4 w-5/6 my-35 justify-center">
              
              <ResetPasswordForm loadFunction={setIsLoading}/>
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