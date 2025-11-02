"use client";
import { useState,useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

import { useRouter } from 'next/navigation';
import {request} from "../utils/request";
import { is } from "date-fns/locale";

export default function RegisterForm(params){
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg,setErrorMsg] = useState(null)
    const [name,setName] = useState(null)
    const [surname,setSurname] = useState(null)
    const [email,setEmail] = useState(null)
    const router = useRouter();
    const loadFunction = params.loadFunction;

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('name');
        const surname = urlParams.get('surname');
        const email = urlParams.get('email');
        setName(name != null && name != "undefined" ? name : "");
        setSurname(surname != null && surname != "undefined" ? surname : "");
        setEmail(email != null && email != "undefined" ? email : "");
    },[]);


    async function sendMessage(e){
        e.preventDefault();
        console.log("Invio messaggio...");
        const formData = new FormData(e.target);
        const name = formData.get("name");
        const surname = formData.get("surname");
        const phoneNumber = formData.get("phone");
        const email = formData.get("email");
        const password = formData.get("password");
        const passwordConfirm = formData.get("passwordConfirm");
        const marketing = formData.get("marketing") == "on" ? "Y" : "N";
        const isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';

        if (password != passwordConfirm){
            setErrorMsg("Le password non coincidono")
            return;
        }
        const passwordRegex = /^.{6,}$/;
        if (!passwordRegex.test(password)){
            setErrorMsg("La password deve contenere almeno 8 caratteri, una lettera e un numero")
            return;
        }

        const response = await request({
            url: "/api/user/signup",
            method: "POST",
            body: { email, password, name, surname, phoneNumber, marketing },
            loadFunction,
        });
        if (response.ok) {
            setErrorMsg(null);
            loadFunction(true);
            router.push("/confirmRegistration?userId="+response.data.userId+(isPopup ? "&popup=true" : ""));
        }
        else{
            setErrorMsg(response.data.message);
        }
    }

    return(
        <div className="lg:w-2/5 w-full rounded-2xl bg-white lg:ml-20 lg:mb-15 mb-5 text-black drop-shadow-2xl shadow-2xl">
            <form onSubmit={(e)=>{ sendMessage(e)}} className="flex flex-col h-full my-10 text-xs lg:text-lg">
            <input name="name" id="name" className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl focus:outline-none" defaultValue={name} type="text" placeholder="Nome *" required></input>
            <input name="surname" id="surname" className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl focus:outline-none" defaultValue={surname} type="text" placeholder="Cognome *" required></input>
            <input name="email"id="email" pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 val rounded-3xl focus:outline-none" defaultValue={email} type="text" placeholder="Email *" required></input>
            <input name="phone" id="phone" pattern="^3\d{2}\s?\d{6,7}$" className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl focus:outline-none" type="text" placeholder="Telefono *" required></input>
            <div className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl  flex flex-row">
                <input name="password" id="password" className="focus:outline-none w-full" type={showPassword ? "text" : "password"} placeholder="Password *" required></input>
            
                <button
                    type="button"
                    className="relative top-1/2 transform lg:-translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <div className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl  flex flex-row">
            <input name="passwordConfirm" id="passwordConfirm" className="focus:outline-none w-full" type={showConfirmPassword ? "text" : "password"} placeholder="Conferma Password *" required> 
            </input>
                <button
                    type="button"
                    className="relative top-1/2 transform lg:-translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <div className="flex flex-row mx-8">
                <input required type="checkbox" className="mx-2"/><div>Ho visionato e accetto i <a target="_blank" href="/termini_condizioni_planetsoccer.pdf" className="font-bold underline">Termini e condizioni </a>*</div>
            </div>
            <div className="flex flex-row mx-8">
                <input name="marketing" type="checkbox" className="mx-2"/><div>Voglio guadagnare <a className="font-bold">punti</a> e ricevere informative su <a className="font-bold">sconti</a> e <a className="font-bold">iniziative</a></div>
            </div>
            {errorMsg != null?<a className="self-center text-red-500">{errorMsg}</a>:""}
            <input 
            type="submit" 
            value="Registrati" 
            className="border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] font-bold text-white mx-8 mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors self-center" 
            />
            </form>
        </div>
        );
}