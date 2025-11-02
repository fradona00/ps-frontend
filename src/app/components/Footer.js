

import Image from "next/image";
import {Instagram, FacebookIcon} from "lucide-react";
import logo from "../../../public/logoorizzontale.svg";

export default function Footer(){
    return(
        <footer className="flex flex-col lg:flex-row w-full p-4 bg-[#080C19] text-white text-center items-center text-sm font-[oswald] font-extralight">
            <div className="flex flex-col mx-auto my-5 lg:my-0">
                <p className="font-light text-lg hidden lg:block">SEGUICI ANCHE SU</p>
                <div className="flex flex-row justify-center">
                    <a className="hover:cursor-pointer" target="_blank" href="https://www.instagram.com/planetsoccer_cesanomaderno"><Instagram width={30}/></a>
                    <a className="hover:cursor-pointer" target="_blank" href="https://www.facebook.com/planetsoccercesano"><FacebookIcon width={30} className="mx-4"/></a>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row mx-auto items-center my-2 lg:my-0">
                <div className="flex flex-row justify-center items-center mx-4">
                    <Image alt="planetSoccer" className="mr-2 lg:block hidden" src={logo} width={120}></Image>
                    <a className="text-sm font-light font-[oswald]">P.IVA 13578820964</a>
                    <a target="_blank" href="/termini_condizioni_planetsoccer.pdf" className="text-sm font-light font-[oswald] lg:hidden block mx-4 underline">TERMINI E CONDIZIONI</a>
                </div>
                <div className="flex-row hidden lg:flex">
                    <a  href="/servizi#about" className="mx-4">CHI SIAMO</a>
                    <a  href="/reservation"  className="mx-4">PRENOTA ORA</a>
                    <a  href="/register" className="mx-4">REGISTRATI</a>
                    <a target="_blank" href="/termini_condizioni_planetsoccer.pdf" className="mx-4">TERMINI E CONDIZIONI</a>
                </div>
            </div>
            <p className="mx-auto my-2 lg:my-0">DESIGN BY <a className="font-medium underline underline-offset-2" href="https://www.linkedin.com/in/chiara-milan-528611290/">Chiara Milan</a> | <a className="font-medium underline underline-offset-2" href="https://www.linkedin.com/in/francesco-donatellis-1a5438188/">Francesco Donatellis</a></p>
        </footer>
    )
}