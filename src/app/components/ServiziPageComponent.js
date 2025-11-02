"use client";
import Navbar from "./Navbar";
import Image from "next/image";
import Footer from "./Footer";
import LoadingScreen from "./LoadingScreen";
import {  useState } from "react";
import CookieConsent from "react-cookie-consent";
import {ChevronDown} from "lucide-react";
import Logo from "../../../public/logoorizzontale.svg";
import campi from "../../../public/campi.webp";
import padel_servizi from "../../../public/padel_servizi.webp";
import padel2_servizi from "../../../public/padel2_servizi.webp";
import calcio_servizi from "../../../public/calcio_servizi.webp";
import calcio2_servizi from "../../../public/calcio2_servizi.webp";


export default function ServiziPageComponent() {

    const [isLoading, setIsLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    return (
        <div className="flex flex-col min-h-screen w-full">
            <LoadingScreen visible={isLoading} />
            <main className="flex-grow flex flex-col items-center justify-center bg-gray-100 w-full overflow-x-hidden">
                <Navbar loadFunction={setIsLoading}/>
                <div className="bg-[#001F3F] w-full flex flex-col">
                <div className="w-full flex flex-col bg-[url('/background_servizi.webp')] bg-center bg-cover py-20 min-h-[100vh] ">
                    <div className="flex flex-row lg:text-8xl text-6xl font-black text-white lg:w-3/5 w-7/8 max-xs:text-5xl lg:mt-[10vh] mx-auto text-center my-auto">
                        <Image alt="globe" src={Logo} className="mx-auto"/>
                    </div>
                    <div className="flex flex-wrap lg:flex-row flex-col lg:lg:text-2xl text-xl  text-[#0E285C] lg:w-3/5  w-7/8  mt-[4vh] mx-auto font-[oswald] font-bold justify-between text-center my-auto">
                       <a href="#padel" className="border-0 rounded-4xl bg-[#FFFFFF] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors mt-4 mx-auto w-3/4 lg:w-1/5">PADEL</a>
                       <a href="#calcio" className="border-0 rounded-4xl bg-[#FFFFFF] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors mt-4 mx-auto w-3/4 lg:w-1/5">CALCIO A 5</a>
                       <a href="#about" className="border-0 rounded-4xl bg-[#FFFFFF] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors mt-4 mx-auto w-3/4 lg:w-1/5">ABOUT US</a>
                       <a href="#infopoint" className="border-0 rounded-4xl bg-[#FFFFFF] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors mt-4 mx-auto w-3/4 lg:w-1/5">INFO POINT</a>
                       <div className="w-full hidden lg:block" />
                       <a href="/reservation" target="_blank" className="text-white border-0 rounded-4xl bg-[#164194] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors mt-4 mx-auto w-3/4 lg:w-1/5">PRENOTA ORA!</a>
                    </div>
                </div>
                <div id="about" className="w-full bg-gradient-to-b from-[#004300] to-[#001F3F] min-h-[100vh] flex flex-col">
                    <div className="lg:w-3/4 w-7/8  lg:mt-[4vh] py-auto flex lg:flex-row flex-col mx-auto items-center">
                    <Image alt="iconaCalcio" src={campi} className="lg:w-2/5 mx-auto max-h-[40vh] align-middle rounded-2xl lg:mb-0 mb-10"/>
                    <div className="flex flex-col lg:w-3/4 w-7/8 self-start lg:mt-[4vh] py-auto lg:mx-5 text-start">
                        <p className="font-[montserrat] lg:text-8xl text-4xl font-black text-[#F5DA00] lg:ml-[12.6%]">ABOUT US</p>
                        <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8 lg:ml-[12.6%] my-8 text-start">
                        <a className="font-semibold">Il Centro Sportivo nasce nel 2003 a Cesano Maderno</a>, l’obiettivo di offrire uno spazio dedicato allo sport e al tempo libero in un ambiente accogliente e immerso nel verde, ideale per tutti.
                        </p>
                        <p className="lg:text-2xl font-light text-white self-start text-start lg:ml-[12.6%] lg:mb-12 lg:w-3/4 w-7/8">
                            Oggi la struttura offre <a className="font-semibold">un campo da calcio a 5 e sei campi da padel</a>, con spogliatoi attrezzati e un bar accogliente, ideale per rilassarsi dopo una partita.
Da sempre a gestione familiare, negli anni il centro è cresciuto coinvolgendo nuove persone di fiducia per offrirti un’esperienza sempre migliore.
                        </p>
                    </div>
                    
                    </div>
                    <a href="#padel"><ChevronDown size={100} className="mx-auto lg:my-auto text-white animate-bounce self-end align-bottom justify-self-end mt-10"/></a>
                </div>
                <div id="padel" className="flex flex-col font-black text-white w-full max-xs:mx-auto bg-gradient-to-b from-[#001F3F] to-[#004300] min-h-[100vh]">
                    
                    <div className="flex lg:flex-row-reverse flex-col lg:w-3/4 w-7/8 mx-auto items-center">
                    <Image alt="iconaCalcio" src={padel_servizi} className="lg:w-2/5 mx-auto max-h-[40vh] align-middle rounded-2xl lg:mb-0 mb-10"/>
                    <div  className="flex flex-col w-full">
                        <div>
                            <p  className="lg:text-8xl text-4xl font-black text-[#F5DA00]">PADEL</p>
                            <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8  my-8 text-start">
                            Gli amanti del padel troveranno strutture moderne con superfici professionali per un’esperienza di gioco ottimale.
                            <strong>I nostri 6 campi offrono soluzioni per ogni esigenza:</strong>
                            </p>
                        </div>
                        <div>
                            <p className="lg:text-6xl text-3xl font-black text-white">2 CAMPI OUTDOOR</p>
                            <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8  my-8 text-start">
                            Gioca sotto il sole e goditi l’energia del padel all’aria aperta.
                            </p>
                        </div>
                        <div>
                            <p className="lg:text-6xl text-3xl font-black text-white">4 CAMPI INDOOR</p>
                            <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8 my-8 text-start">
                            Perfetti con qualsiasi meteo, per non fermarti mai.
                            </p>
                        </div>
                    </div>
                    
                    </div>
                    <a href="#calcio"><ChevronDown size={100} className="mx-auto lg:my-auto mt-10 text-white animate-bounce self-end align-bottom justify-self-end"/></a>
                </div>
                <div id="calcio" className="w-full bg-gradient-to-b from-[#004300] to-[#001F3F] min-h-[100vh] flex flex-col justify-between">
                    <div className="lg:w-3/4 w-7/8 max-xs:mx-auto  lg:mt-[4vh] mx-auto py-auto flex lg:flex-row flex-col">
                    <div className="flex lg:flex-row flex-col items-center">
                     <Image  alt="iconaCalcio" src={calcio_servizi} className="lg:w-2/5 mx-auto max-h-[40vh] align-middle rounded-2xl lg:mb-0 mb-10"/>
                    <div className="flex flex-col lg:w-3/4 w-7/8 lg:ml-[12.6%] lg:mt-[4vh] lg:mx-auto py-auto text-start self-start">
                        <p className="font-[montserrat] lg:text-8xl text-4xl font-black text-[#F5DA00] lg:ml-[12.6%]">CALCIO A 5</p>
                        <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8 lg:ml-[12.6%] my-8 text-start">
                        Il nostro campo da calcio a 5 è progettato per offrirti il massimo delle prestazioni.
                        </p>
                        <p className="font-[montserrat] lg:text-6xl text-3xl font-black text-white lg:ml-[12.6%]">MANTO DI ULTIMA GENERAZIONE</p>
                        <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8 lg:ml-[12.6%] my-8 text-start">
                        Grazie a un manto di ultima generazione, puoi vivere partite intense e spettacolari, con un perfetto equilibrio tra velocità di gioco e comfort.
                        </p>
                    </div>
                    </div>
                    </div>
                    <a href="#infopoint"><ChevronDown size={100} className="mx-auto lg:my-auto text-white animate-bounce self-end align-bottom justify-self-end"/></a>
                </div>
                <div id="infopoint" className="w-full max-xs:mx-auto bg-gradient-to-b from-[#001F3F] to-[#004300] mx-auto min-h-[100vh] pb-5">
                    <div className="flex flex-col lg:w-3/4 w-7/8 mx-auto">
                        <div>
                            <p className="lg:text-8xl text-4xl font-black text-[#F5DA00]">INFO POINT</p>
                            <p className="lg:text-2xl font-light text-white lg:w-3/4 w-7/8 mt-8 text-start">Hai bisogno di <a className="font-semibold">prenotare</a> un campo, <a className="font-semibold">iscriverti</a> a un torneo o semplicemente ricevere <a className="font-semibold">informazioni</a>? 
Il nostro Info Point & Reception ha uno staff sempre disponibile per aiutarti a organizzare al meglio la tua esperienza sportiva e scoprire le novità in programma.</p>
                        </div>
                        <div className="flex lg:flex-row flex-col justify-between mx-auto w-full ">
                            <Image alt="iconaInfo" src={padel2_servizi} className="lg:w-1/4 w-full mt-10 mx-auto my-auto max-h-[50vh] rounded-2xl"/>
                            <Image alt="iconaInfo" src={calcio2_servizi} className="lg:w-1/4 w-full mt-10 mx-auto my-auto max-h-[50vh] rounded-2xl"/>
                            <Image alt="iconaInfo" src={padel_servizi} className="lg:w-1/4 w-full mt-10 mx-auto my-auto max-h-[50vh] rounded-2xl"/>
                        </div>
                    </div>
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