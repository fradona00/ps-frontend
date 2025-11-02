"use client";
import { useState } from "react";
import { request } from "../utils/request";
import ReCAPTCHA from 'react-google-recaptcha';


export default function ContactForm(params){

    const [typeSelected,setTypeSelected] = useState("c-2");
    const [messageSent,setMessageSent] = useState(false);
    const [message,setMessage] = useState("");
    const loadFunction = params.loadFunction;
    const [token, setCaptchaToken] = useState(null);

    function onCaptchaChange(token) {
        setCaptchaToken(token); // ricevi il token qui
    }

    function selectType(id){
        if (typeSelected != null){
            document.getElementById(typeSelected).classList.remove("bg-[#001F3F]");
            document.getElementById(typeSelected).classList.add("bg-[#164194]")
        }
        console.log(id)
        setTypeSelected(id);
        document.getElementById(id).classList.remove("bg-[#164194]")
        document.getElementById(id).classList.add("bg-[#001F3F]")
    }

    async function sendMessage(e){
        e.preventDefault();
        if (!token) {
            alert("Verifica reCAPTCHA obbligatoria");
            return;
        }
        const formData = new FormData(e.target);
        const name = formData.get("name");
        const email = formData.get("email");
        const message = formData.get("message");
        const type = typeSelected.charAt(2);
        await request ({
            url: "/api/user/sendMessage",
            method: "POST",
            body: { type, name, email, message, token },
            loadFunction
        });
        setCaptchaToken(null); // resetta il token dopo l'invio
        setMessageSent(true);
        setMessage("Messaggio inviato con successo, Grazie!");
    }
    //todo aggiungi i'm not a robot
    return(
    <form className="lg:w-3/5 w-full rounded-2xl bg-[#003473] lg:ml-20 lg:mb-15 mb-5" onSubmit={(e)=>{ sendMessage(e)}}>
        {messageSent ? <div className="w-full h-full flex content-center align-middle"><a className="text-xl text-center text-gray-400 font-bold w-full mx-8 lg:mt-10 mt-4 mb-4">{message}</a></div> : null}
        {!messageSent ? 
        <div className="flex flex-col h-full">
            <a className="text-xl text-gray-400 font-light w-full mx-8 lg:mt-10 mt-4 mb-4">Sono interessato a:</a>
            <div className=" flex flex-row mb-6 w-full">
                <div className="lg:mx-6 mx-auto">
                    <button id="c-0" onClick={() => selectType("c-0")} className="border-0 rounded-4xl text-xs lg:text-lg bg-[#164194] mx-2 py-2 lg:px-8 px-4 hover:cursor-pointer hover:bg-[#001F3F]">Calcio a 5</button>
                    <button id="c-1" onClick={() => selectType("c-1")} className="border-0 rounded-4xl text-xs lg:text-lg bg-[#164194] mx-2 py-2 lg:px-8 px-4 hover:cursor-pointer hover:bg-[#001F3F]">Padel</button>
                    <button id="c-2" onClick={() => selectType("c-2")} className="border-0 rounded-4xl text-xs lg:text-lg bg-[#164194] mx-2 py-2 lg:px-8 px-4 hover:cursor-pointer hover:bg-[#001F3F]">Altro</button>
                </div>
            </div>
            <input name="name" id="name" className="mb-6 mx-8 border-b-2 focus:outline-none" type="text" placeholder="Il tuo nome" required></input>
            <input name="email" id="email" pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" className="mb-6 mx-8 border-b-2 focus:outline-none" type="text" placeholder="La tua email" required></input>
            <textarea name="message" id="message" className="mb-6 mx-8 border-b-2 focus:outline-none resize-none min-h-40 h-full" maxLength="400" placeholder="Il tuo messaggio" required></textarea>
            <div className="mb-6 mx-2 lg:mx-8 scale-[0.85] lg:scale-[1]">  
                <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_SITE_KEY}
                onChange={onCaptchaChange}
                />
            </div>
            <input 
            type="submit" 
            className="border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] mx-8 my-6 py-2 px-8 hover:cursor-pointer hover:bg-[#001F3F]"
            value="Invia Messaggio"/>
        </div>
        :""}
    </form>
    );
}