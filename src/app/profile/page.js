"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import { useState, useEffect } from "react";
import CookieConsent from "react-cookie-consent";
import { User2Icon, ChevronRight, Calendar, Gift } from "lucide-react";
import Cookies from "js-cookie";
import { request } from "../utils/request";
import Image from "next/image";
import PlanetSoccer from "../../../public/logoverticale.svg";
import UserDashboard from "../components/UserDashboard";
import ModificaPasswordForm from "../components/ModificaPasswordForm";
import UserPromotionsPage from "../components/UserPromotionsPage";
  
export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [showInfo, setShowInfo] = useState("INFO");
    const [token, setToken] = useState(null);
    const [points, setPoints] = useState(0);

    const tabsArray = [
        { name: "INFO", label: "Profilo" },
        { name: "ORDERS", label: "Prenotazioni" },
        { name: "PROMO", label: "Promozioni" },
    ];

    async function fetchUserData() {
        const userData = Cookies.get('sessionCookie');
        if (userData) {
            var parsedData = null;
            try{
                parsedData = JSON.parse(userData);
                setToken(parsedData.token);
            }catch (error) {
                setIsLoading(true);
                console.error("Errore durante il parsing dei dati dell'utente:", error);
                Cookies.remove('sessionCookie'); // Rimuovi il cookie se c'è un errore
                window.location.href = "/login";
            }
            const pointsResponse = await request({
                url: "/api/user/points",
                method: "POST",
                body: {},
                loadFunction: setIsLoading,
                token: parsedData.token,
            });
            setPoints(pointsResponse.data.points || 0);
            const params = new URLSearchParams(window.location.search);
            console.log("params", params);
            let currentTab = params.get("tab");
            if (currentTab != null){
                if (tabsArray.some(tab => tab.name === currentTab)){
                    setShowInfo(currentTab);
                } else {
                    setShowInfo("INFO");
                }
            }
        } else{
            setIsLoading(true);
            window.location.href = "/login";
        }
    }

    useEffect(() =>  {
        fetchUserData();
    }
    , []);


    return (
        <div className="flex flex-col min-h-screen w-full">
            <LoadingScreen visible={isLoading} />
            <main className="flex-grow flex flex-col items-center justify-center bg-[#001F3F] w-full overflow-x-hidden text-white">
                <Navbar loadFunction={setIsLoading}/>
                <div className="flex flex-col lg:flex-row lg:w-3/4 w-full md:mt-30 mt-20 md:mb-0 mb-5 justify-between">
                    <div className="flex md:flex-row flex-col text-black shadow-lg md:p-10 w-full">
                        <div className="md:rounded-l-2xl rounded-2xl md:rounded-r-none  flex md:flex-col flex-col md:w-1/6 w-5/6 mx-auto md:mx-0 my-2 md:my-0 bg-white items-center">
                            <div className="flex flex-col">
                            <Image src={PlanetSoccer} alt="Logo" width={120} className="md:my-10 md:block hidden self-center"/>
                            <span className="md:text-xl text-lg md:mx-auto font-bold text-[#164194] font-[montserrat] md:my-5 my-2 mx-2 flex-1"> Hai {points} Punti </span>
                            </div>
                            <div className="flex md:flex-col md:mx-auto justify-between w-full px-2">
                            <div onClick={() => setShowInfo("INFO")}
                             className="items-center md:w-full md:flex-1 transition-colors hover:bg-[#D3E2F1] rounded-3xl md:px-2 py-1 cursor-pointer md:text-md text-xs font-bold text-[#164194] font-[montserrat] flex flex-row my-2">
                                <div className="flex flex-col md:flex-row md:items-start md:text-start items-center text-center md:mx-0 ml-auto"><User2Icon width={20} className="md:mr-2"/> <a className="my-auto">PROFILO</a></div><div className="hidden md:block"><ChevronRight/></div>
                            </div>
                            <div onClick={() => setShowInfo("ORDERS")}
                             className="items-center md:w-full md:flex-1 transition-colors hover:bg-[#D3E2F1] rounded-3xl md:px-2 py-1 cursor-pointer md:text-md text-xs font-bold text-[#164194] font-[montserrat] flex flex-row my-2">
                                <div className="flex flex-col md:flex-row items-center text-center md:mx-0"><Calendar width={20} className="md:mr-2"/>PRENOTAZIONI</div> <div className="hidden md:block"><ChevronRight/></div>
                            </div>
                            <div onClick={() => setShowInfo("PROMO")}
                             className="items-center md:w-full md:flex-1 transition-colors hover:bg-[#D3E2F1] rounded-3xl md:px-2 py-1 cursor-pointer md:text-md text-xs font-bold text-[#164194] font-[montserrat] flex flex-row my-2">
                                <div className="flex flex-col md:flex-row items-center text-center md:mx-0 mr-auto"><Gift width={20} className="md:mr-2"/>PROMOZIONI</div> <div className="hidden md:block"><ChevronRight/></div>
                            </div>
                            </div>
                        </div>
                        {showInfo == "INFO"?
                            <ModificaPasswordForm loadFunction={setIsLoading}/>:""}
                        {showInfo == "ORDERS"?
                        <div className="w-5/6 bg-[#164194] md:rounded-r-2xl rounded-2xl md:rounded-l-none flex flex-col md:p-10 p-5 md:mx-0 mx-auto">
                            <UserDashboard token={token} loadFunction={setIsLoading}/>
                        </div>:""}
                        {showInfo == "PROMO"?
                            <UserPromotionsPage loadFunction={setIsLoading} points={points}/>:""}
                    </div>
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