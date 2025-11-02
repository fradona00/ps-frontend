"use client";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LoadingScreen from "./LoadingScreen";
import { useEffect, useState } from "react";
import CookieConsent from "react-cookie-consent";
import BookingCalendar from "./BookingCalendarComponent";
import { request } from "../utils/request";
import Cookies from "js-cookie";
import LoginPopup from "./LoginPopup";

export default function ReservationPageComponent() {
    const [isLoading, setIsLoading] = useState(true);
    const [showLoginForm, setShowLoginForm] = useState(false); // Stato per mostrare il modulo di login
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [resetTrigger, setResetTrigger] = useState(0);

    async function checkRefreshToken() {
            if (Cookies.get('sessionCookie') == null) return;
            const userData = await JSON.parse(Cookies.get('sessionCookie'));
            if (userData && userData.rememberMe){
                if (new Date(userData.expiresIn) < new Date()){
                    Cookies.remove('sessionCookie');
                    return;
                }
                if (userData.token != null){
                    const expiresAt = new Date(userData.expiresIn);
                    const now = new Date();
                    
    
                    // Calcola la differenza in millisecondi
                    const diffMs = expiresAt - now;
    
                    // Millisecondi in 7 giorni
                    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
                    // Verifica se è entro una settimana (e non già scaduto)
                    if (diffMs > 0 && diffMs <= oneWeekMs) {
                        const refreshTokenResponse = await request({
                            url: "/api/user/refreshToken",
                            method: "POST",
                            token: userData.token,
                            body: { },
                            loadFunction: setIsLoading,
                        });
                        if (refreshTokenResponse.data.token != null){
                            Cookies.set('sessionCookie', refreshTokenResponse.data, { expires: 30 });
                        } else {
                            Cookies.remove('sessionCookie');
                        }
                    }
                }
                
            }
        }
    
        useEffect(() => {
            checkRefreshToken();
            
        }, []);

    // Controlla se l'utente è loggato
    const checkLogin = () => {
        const userData = Cookies.get('sessionCookie');
        if (userData) {
            try{
                const parsedData = JSON.parse(userData);
                if (!parsedData.token){
                    setShowLoginForm(true); // Mostra il modulo di login se l'utente non è loggato
                    return;
                }
                const token = parsedData.token;
                return token;
            }catch (error) {
                setShowLoginForm(true);
                console.error("Errore durante il parsing dei dati dell'utente:", error);
            }
        } else {
            setShowLoginForm(true); // Mostra il modulo di login se l'utente non è loggato
        }
    }

    const handleLoginClick = () => {
        const popup = window.open(
            '/login?popup=true',
            'LoginPopup',
            'width=500,height=600'
        );

        if (!popup) {
            alert('Popup bloccato! Consenti i popup per continuare.');
            return;
        }

        // Listener per ricevere il messaggio dal popup
        const receiveMessage = (event) => {
            if (event.origin == window.location.origin){
                if (event.data.type === 'LOGIN_SUCCESS') {
                    console.log('Utente loggato:', event.data.payload);
                    popup.close();
                    window.removeEventListener('message', receiveMessage);

                    setShowLoginForm(false); // Nascondi il modulo di login
                    checkLogin(); // Controlla lo stato di login
                    setResetTrigger(resetTrigger + 1); // Trigger per aggiornare lo stato della pagina
                }
            }
        };
        window.addEventListener('message', receiveMessage);
    }

    return (
        <div className="flex flex-col min-h-screen w-full">
            <LoadingScreen visible={isLoading} />
            <LoginPopup visible={showLoginForm} onClick={handleLoginClick}/>
            <main className="flex-grow flex flex-col items-center justify-center bg-[#001F3F] w-full overflow-x-hidden text-white">
                <Navbar loadFunction={setIsLoading} key={resetTrigger}/>
                <div className={!selectedSlot && !showPaymentForm?"flex flex-col lg:w-3/4 w-5/6 my-30 justify-between bg-white text-black rounded-3xl shadow-lg lg:p-10 p-5":
                    selectedSlot?"flex flex-col lg:w-3/4 w-5/6 my-30 justify-between text-black rounded-3xl md:p-10":showPaymentForm?"flex flex-col w-fit lg:w-1/3 my-30 justify-between text-black rounded-3xl p-10":""}>
                    <BookingCalendar setShowPaymentForm={setShowPaymentForm} showPaymentForm={showPaymentForm} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} checkLogin={checkLogin} loadFunction={setIsLoading}/>
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