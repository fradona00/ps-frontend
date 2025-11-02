"use client";
import Card from "./Card";
import Navbar from "./Navbar";
import image from "../../../public/globe.svg";
import Image from "next/image";
import ContactForm from "./ContactForm";
import iconaCalcio from "../../../public/icone_Calcio.svg";
import iconaPadel from "../../../public/icone_Padel.svg";
import iconaInfo from "../../../public/icone_Info.svg";
import Footer from "./Footer";
import LoadingScreen from "./LoadingScreen";
import { useEffect, useState } from "react";
import CookieConsent from "react-cookie-consent";
import WelcomeMessage from "./WelcomeMessage";
import { request } from "../utils/request";
import { Phone, MapPin, Instagram, FacebookIcon} from "lucide-react";

export default function HomePage() {

    async function getWelcomeMessage() {
        try {
            const response = await request({
                url: "/api/user/getWelcomeMessage",
                method: "POST",
                isLoading,
            })

            if (response && response.ok && response.data.title) {
                setWelcomeMessage({title : response.data.title || "" , message : response.data.message || ""});
                setVisible(true);
            }
        } catch (error) {
        console.error("Errore nel recupero del messaggio di benvenuto:", error)
        }
    }

    useEffect( () => {
        getWelcomeMessage();

    }, []);

    const [isLoading, setIsLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const [welcomeMessage, setWelcomeMessage] = useState({
        title: "",
        message: ""
    });
    return (
        <div className="flex flex-col min-h-screen w-full">
            <LoadingScreen visible={isLoading} />
            <WelcomeMessage visible={visible} setVisible={setVisible} title={welcomeMessage.title} message={welcomeMessage.message} />
            <main className="flex-grow flex flex-col items-center justify-center bg-gray-100 w-full overflow-x-hidden">
                <Navbar loadFunction={setIsLoading}/>
                <div className="bg-[#001F3F] w-full flex flex-col">
                <div className="w-full flex flex-col bg-[url('/backgroundsm.webp')] sm:bg-[url('/background.webp')] bg-center bg-cover py-20">
                    <p className="lg:text-8xl text-6xl font-black text-white lg:w-3/4 w-5/6 max-xs:text-5xl mt-8 lg:mt-[10vh] mx-auto text-start">
                        IL TUO UNIVERSO SPORTIVO
                        A <br/><a className="text-[#FFD100]">CESANO MADERNO</a>
                    </p>
                    <p className="lg:text-4xl text-3xl  text-white lg:w-3/4  w-5/6  mt-[4vh] mx-auto font-[oswald] font-light">
                        DOVE IL <a className="font-bold">PADEL</a> E IL <a className="font-bold">CALCIO A 5</a> <br/>NON SONO SOLO UN GIOCO, MA UN'ESPERIENZA
                    </p>
                    <p className="mx-auto mt-10 text-2xl lg:text-4xl text-white  lg:w-3/4 w-5/6  font-bold font-[oswald]">
                        <a href="#prenota" className="border-0 rounded-4xl bg-[#164194] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors ">PRENOTA ORA</a>
                    </p>
                </div>
                <div className="w-full bg-gradient-to-b from-[#264E91] to-[#001F3F]">
                    <p id="servizi" className="lg:text-8xl text-6xl font-black text-[#FFD100] lg:w-3/4 w-5/6  text-start mt-[3vw] mx-auto">
                        I SERVIZI
                    </p>
                    <p className="lg:text-4xl text-3xl mx-auto lg:w-3/4 w-5/6  text-white font-[oswald] font-light">
                        COSA TROVERAI NEL NOSTRO CLUB
                    </p>
                    <div className="lg:w-3/4 w-5/6  mt-10 mx-auto ">
                        <div className="flex w-full mx-auto lg:flex-row flex-col justify-between">
                            <Card srcImage={iconaPadel} text="6 campi professionali, di cui 4 coperti e 2 all'aperto, per giocare tutto l'anno col massimo del comfort" title="PADEL"/>
                            <Card srcImage={iconaCalcio} text="Un campo di ultima generazione per partite, tornei e allenamenti con gli amici" title="CALCIO A 5"/>
                            <Card srcImage={iconaInfo} text="Il nostro staff è a tua disposizione per prenotazione, informazioni e dettagli su eventi e tornei." title="INFO POINT"/>
                        </div>
                    </div>
                    <div className="lg:w-3/4 w-5/6  mx-auto flex justify-end lg:mb-20 mb-10">
                        <p onClick={()=>{setIsLoading(true);window.location.href="/servizi"}}className="mt-[3vw] text-2xl lg:text-2xl text-white font-bold font-[oswald] ">
                            <button className="border-0 rounded-4xl font-oswald font-bold bg-[#164194] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors ">
                                <p>SCOPRI DI PIU'</p>
                                <p className="font-light text-sm">CLICCA QUI</p>
                            </button>
                        </p>
                    </div>
                </div>
                <div id="prenota"></div>
                <div className="flex flex-col  font-black text-white lg:w-3/4 w-5/6 max-xs:mx-auto  lg:mt-[4vh] mx-auto">
                    <p className="lg:text-8xl text-4xl  min-w-full">PRENOTAZIONE</p><a className="lg:text-5xl/tight text-xl font-light font-[oswald] text-white">PRENOTA IL TUO CAMPO IN POCHI CLICK</a>
                </div>
                <p className="text-2xl font-light text-white lg:w-3/4 w-5/6  max-w-[60ch] mx-auto lg:ml-[12.6%] my-8 text-start">
                Prenota il tuo campo da <a className="font-bold">Padel</a> o <a className="font-bold">Calcio a 5</a> direttamente sul nostro sito, senza costi aggiuntivi e con registrazione semplice e veloce. Paga solo il campo e goditi la partita senza pensieri!
                </p>
                <p className="text-2xl font-light text-white lg:w-3/4 w-5/6 mx-auto max-w-[21ch] lg:max-w-[30ch] lg:ml-[12.6%] text-start lg:mb-12">
                Preferisci usare Playtomic? Nessun problema! Puoi trovarci anche lì e prenotare in pochi secondi.
                </p>
                <div className="flex flex-col text-2xl font-extralight text-white lg:w-3/4 w-5/6  mx-auto mt-10 lg:mb-20 mb-10">
                Prenota ora sul nostro sito o su Playtomic!
                    <div className="flex lg:flex-row flex-col w-2/3 lg:w-1/2 mt-5">
                        <a href="/reservation" className="text-center rounded-4xl bg-[#164194] mx-2 py-2 border-3 border-[#FFD100] hover:cursor-pointer transition-colors  hover:bg-[#FFD100] hover:text-[#164194] font-[oswald]  font-bold px-8 lg:px-20 lg:mb-0 mb-5">
                            <p className="text-xl lg:text-2xl">PRENOTA ORA</p>
                            <p className="text-lg font-light">CLICCA QUI</p>
                        </a>
                        <a href="https://playtomic.io/planet-soccer/29b13e8b-92a7-4a40-bd8d-3b8da66650bc" target="_blank" className="flex flex-col justify-center text-center border-0 rounded-4xl font-[oswald] font-bold bg-[#164194] mx-2 px-10 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors">
                            <p className="text-xl lg:text-2xl">PLAYTOMIC</p>
                            <p className="text-lg font-light">CLICCA QUI</p>
                        </a>
                    </div>
                </div>
                <div id="contatti" className="flex lg:flex-row flex-col text-white lg:w-3/4 w-5/6  lg:mt-6 mx-auto justify-center">
                    <div className="flex flex-col lg:w-2/5">
                        <p className="lg:text-6xl text-4xl font-black break-normal mb-5">HAI BISOGNO DI INFORMAZIONI?</p>
                        <p className="lg:text-5xl text-4xl font-[oswald] font-light break-normal" >SCRIVI AL NOSTRO TEAM!</p>
                        <div className="flex flex-row w-fit my-8">
                            <Phone width={30}/>
                            <div className="flex flex-col w-fit mx-4"><a className="font-light">Tel.</a></div>
                            <div className="flex flex-col w-fit mx-4"><a className="font-light">335 657 9807</a></div>
                        </div>
                        <div className="flex flex-row w-fit">
                            <MapPin width={30}/>
                            <a target="_blank" href="https://maps.app.goo.gl/5g19ALScEjqmKLUj7" className="mx-4 font-light underline hover:cursor-pointer">Via Abruzzi 10, Cesano Maderno (MB)</a>
                        </div>
                        <div className="flex flex-row w-fit lg:my-10 my-4">
                            <a className="hover:cursor-pointer" target="_blank" href="https://www.instagram.com/planetsoccer_cesanomaderno"><Instagram width={30}/></a>
                            <a className="hover:cursor-pointer" target="_blank" href="https://www.facebook.com/planetsoccercesano"><FacebookIcon width={30} className="mx-4"/></a>
                        </div>
                    </div>
                    <ContactForm loadFunction={setIsLoading}/>
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