"use client";
import Navbar from "./Navbar";
import RegisterForm from "./RegisterForm";
import Footer from "./Footer";
import LoadingScreen from "./LoadingScreen";
import { useEffect, useState } from "react";
import CookieConsent from "react-cookie-consent";
  
export default function RegisterPage() {
    const [isPopup, setIsPopup] = useState(false);

    useEffect(() => {
        let isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';
        setIsPopup(isPopup);
    }, []);

    const [isLoading, setIsLoading] = useState(true);
    return (
        <div className="flex flex-col min-h-screen w-full">
            <LoadingScreen visible={isLoading} />
            <main className="flex-grow flex flex-col items-center justify-center bg-[#001F3F] w-full overflow-x-hidden text-white">
                {!isPopup && (<Navbar loadFunction={setIsLoading}/>)}
                <div className="flex flex-col lg:flex-row lg:w-3/4 w-5/6 mt-30 justify-between">
                    <div className="flex flex-col">
                        <p className="font-bold lg:text-7xl text-5xl my-2">
                            Benvenuto!
                        </p>
                        <p className=" lg:text-3xl text-2xl font-light lg:my-4 mt-4 mb-8">
                            Hai già un account? <a href={"/login"+(isPopup?"?popup=true":"")} className="text-[#FFD100] font-bold underline">Accedi</a>
                        </p>
                    </div>
                    <RegisterForm loadFunction={setIsLoading}/>
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