"use client";
import Navbar from "./Navbar";
import LoginForm from "./LoginForm";
import Footer from "./Footer";
import LoadingScreen from "./LoadingScreen";
import { useState,useEffect } from "react";
import CookieConsent from "react-cookie-consent";
import Cookies from "js-cookie";
import { GoogleOAuthProvider } from "@react-oauth/google";
export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isPopup, setIsPopup] = useState(false);

    useEffect(() => {
        const sessionData = Cookies.get('sessionCookie');
        let isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';
        setIsPopup(isPopup);
        
        if (sessionData) {
            setIsLoading(true);
            if (!isPopup) {
            window.location.href = "/";
            return;
          }
          if (isPopup && window.opener) {
            window.opener.postMessage(
              { type: 'LOGIN_SUCCESS' },
              window.location.origin
            );
            window.close();
          }
        }
    }
    , []);

    return (
        <div className="flex flex-col min-h-screen w-full">
            <LoadingScreen visible={isLoading} />
            <main className="flex-grow flex flex-col items-center justify-center bg-[#001F3F] w-full overflow-x-hidden text-white">
                {!isPopup && (<Navbar loadFunction={setIsLoading}/>)}
                <div className="flex flex-col lg:flex-row lg:w-3/4 w-5/6 my-35 justify-between ">
                    <div className="flex flex-col mb-4">
                        <p className="font-bold lg:text-7xl text-5xl my-2">
                            Bentornato!
                        </p>
                        <p className=" lg:text-3xl text-2xl font-light my-4">
                            Non hai un account? <a href={"/register"+(isPopup?"?popup=true":"")} className="text-[#FFD100] font-bold underline">Registrati</a>
                        </p>
                    </div>
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
                        <LoginForm loadFunction={setIsLoading}/>
                    </GoogleOAuthProvider>
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