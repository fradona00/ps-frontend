"use client";
import Navbar from "../components/Navbar";
import { useEffect, useState } from 'react';
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import CookieConsent from "react-cookie-consent";
import { request } from "../utils/request";
import Cookies from "js-cookie";
import { set } from "date-fns";
import astronauta from "../../../public/astronauta.webp";
import Image from "next/image";

export default function confirmOrderPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [orderId, setOrderId] = useState(null);
    var intervalId = null;

    async function checkOrderStatus() {
        const token = await JSON.parse(Cookies.get("sessionCookie")).token;

        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const response = await request({
            url: "/api/services/confirmReservation",
            method: "POST",
            body: { orderId },
            setIsLoading,
            token
        });

        if (response.ok && response.data.message == "OK") {
            clearInterval(intervalId);
            setIsLoading(false);
            setOrderId(orderId);
        }
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setOrderId(urlParams.get('orderId'));
        /*let attempts = 0;

        checkOrderStatus();
        intervalId = setInterval(() => {
            attempts++;
            if (attempts >= 12) {
                clearInterval(intervalId);
                setIsLoading(false);
            } else {
                checkOrderStatus();
            }
        }, 100000);*/
      }, []);

    return (
      <div className="flex flex-col min-h-screen w-full">
        <LoadingScreen visible={isLoading} />
      <main className="flex-grow flex flex-col items-center  font-light justify-center bg-[#164194] w-full overflow-x-hidden text-white">
          <Navbar loadFunction={setIsLoading}/>
          {!isLoading?<div className="flex text-white xl:flex-row flex-col text-center xl:pt-5 bg-[#001F3F] rounded-3xl xl:w-fit w-7/8 xl:text-3xl text-xl font-[oswald] mt-30 mb-5 2xl:my-auto py-2">
              <Image src={astronauta} className="w-auto h-auto xl:max-h-[60vh] max-h-[20vh] mt-auto xl:mr-auto mx-auto" alt="Astronauta"/>
              <div className="flex flex-col mb-5 mx-5 xl:my-10 my-5 xl:text-start text-center">
                <p className="my-4">GRAZIE PER AVER SCELTO IL NOSTRO CENTRO SPORTIVO!</p>
                <p className="xl:self-start self-center xl:text-7xl text-4xl my-4 font-bold font-[montserrat] text-[#F5DA00] max-w-[13ch]">PRENOTAZIONE CONFERMATA!</p>
                <p className="my-4">NUMERO PRENOTAZIONE <a className="font-bold">{orderId}</a></p>
                <p>RICEVERAI A BREVE UN EMAIL CON TUTTI I DETTAGLI DELLA PRENOTAZIONE.</p> 
                <p className="mt-5"><a onClick={()=>setIsLoading(true)} href="/profile?tab=ORDERS" className="text-s md:text-2xl rounded-2xl border-2 border-[#164194] bg-[#164194] px-2 py-1 font-medium text-[#FFD100] transition-colors hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194]">Le tue prenotazioni</a></p>
              </div>
          </div>:""}

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