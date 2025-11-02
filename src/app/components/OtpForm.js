"use client";
import { useState,useEffect} from "react";

import Cookies from 'js-cookie';
import {request} from '../utils/request';

export default function OtpForm(params){
    const [errorMsg,setErrorMsg] = useState(null)
    const [resendDisabled, setResendDisabled] = useState(true);
    const loadFunction = params.loadFunction;

    function startResendTimer() {
        setResendDisabled(true);
        setTimeout(() => {
            setResendDisabled(false);
        }, 30000); // 30 secondi
    }

    useEffect(()=>startResendTimer(),[]);
    
    async function resendMail(){
        startResendTimer();
        const userId = new URLSearchParams(window.location.search).get("userId");

        const response = await request({
            url: "/api/user/sendconfirmmail",
            method: "POST",
            body: { userId },
            loadFunction,
        });
        if (response.ok) {
            setErrorMsg("Email inviata");
        }
        else{
            setErrorMsg(response.data.message);
        }
    }
        

    async function sendMessage(e){
        e.preventDefault();
        console.log("Invio messaggio...");
        const formData = new FormData(e.target);
        const otp = formData.get("otp");
        const userId = new URLSearchParams(window.location.search).get("userId");
        if (!userId){
            setErrorMsg("ID utente non valido")
            return;
        }
        const isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';
        
        const response = await request({
            url: "/api/user/confirmsignup",
            method: "POST",
            body: { userId, otp },
            loadFunction,
        });
        if (response.ok) {
            if (response.data.token != null){
                loadFunction(true);
                let expire = null
                Cookies.set('sessionCookie',JSON.stringify(response.data),expire);
                alert("Registrazione completata con successo");
                if (!isPopup) {
                    window.location.href="/";
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
        else{
            setErrorMsg("OTP non valido o scaduto");
        }
    }

    return(
        <div className="lg:w-2/5 w-full rounded-2xl bg-white lg:mb-15 mb-5 text-black drop-shadow-2xl shadow-2xl self-center">
            <form onSubmit={(e)=>{ sendMessage(e)}} className="flex flex-col h-full my-10 text-xs lg:text-lg px-5">
            <p className="text-center lg:text-xl text-lg font-medium mb-4">Controlla la tua casella mail <a className="font-semibold">(anche la cartella spam)</a> e inserisci il <a className="font-semibold">codice OTP</a> che hai ricevuto per completare la registrazione</p>
            <input name="otp" id="otp" className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl focus:outline-none" type="text" placeholder="OTP *" required></input>
            {errorMsg != null?<a className="self-center text-red-500">{errorMsg}</a>:""}
            <input 
            type="submit" 
            value="Completa registrazione" 
            className="border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] font-bold text-white mx-8 mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors self-center" 
            />
            <button className={!resendDisabled?"border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] font-bold text-white mx-8 mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors self-center":"border-0 rounded-4xl text-sm lg:text-lg bg-[#616161] font-bold text-black mx-8 mt-4 py-2 px-8 self-center"}
            onClick={()=>resendMail()} disabled={resendDisabled}>Invia codice di nuovo</button>
            </form>
        </div>
        );
}