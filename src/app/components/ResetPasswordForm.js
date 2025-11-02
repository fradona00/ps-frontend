"use client";
import { useState,useEffect} from "react";
import { Eye, EyeOff } from "lucide-react";
import {request} from '../utils/request';

export default function ResetPasswordForm(params){
    const [errorMsg,setErrorMsg] = useState(null)
    const [message, setMessage] = useState(null);
    const [currentJwt, setCurrentJwt] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const loadFunction = params.loadFunction;

    useEffect(()=>getResetPasswordToken(),[]);

    async function sendPasswordResetMessage(e){
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get("password");
        const passwordConfirm = formData.get("passwordConfirm");
        if (password != passwordConfirm){
            setErrorMsg("Le password non coincidono")
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>'])[\w\d!@#$%^&*(),.?":{}|<>']{8,}$/;
        if (!passwordRegex.test(password)){
            setErrorMsg("La password deve contenere almeno 8 caratteri, una lettera e un numero")
            return;
        }
        
        const response = await request({
            url: "/api/user/changePassword",
            method: "POST",
            body: { password },
            loadFunction,
            token: currentJwt,
        });
        if (response.ok) {
            alert("Password cambiata con successo");
            loadFunction(true);
            setErrorMsg(null);
            window.location.href="/login";
        }
        else{
            setErrorMsg("Riprovare più tardi");
        }
    }
    
    function getResetPasswordToken(){
        const userId = new URLSearchParams(window.location.search).get("userId");
        const otp = new URLSearchParams(window.location.search).get("otp");
        if (userId && otp){
            loadFunction(true);
            fetch("/api/user/confirmMailResetPassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, otp}),
            }).then(function(response) {
                loadFunction(false);
                response.json().then(function(data) {
                    if (response.status == 200) {
                       setCurrentJwt(data.token);
                    }
                    else{
                        setErrorMsg(data.message);
                    }
                });
            });
            return;
        }
    }

    async function sendMessage(e){
        e.preventDefault();
        console.log("Invio messaggio...");
        const formData = new FormData(e.target);
        const email = formData.get("email");

        const response = await request({
            url: "/api/user/resetPassword",
            method: "POST",
            body: { email },
            loadFunction,
        });
        if (response.ok) {
            setErrorMsg(null);
            setMessage("E' stata inviata una email con le istruzioni per il reset della password");
        }else{
            setErrorMsg("Riprovare più tardi");
        }
    }

    return(
        <div className="lg:w-2/5 w-full rounded-2xl bg-white lg:mb-15 mb-5 text-black drop-shadow-2xl shadow-2xl self-center">
            {!currentJwt?<
                form onSubmit={(e)=>{ sendMessage(e)}} className="flex flex-col h-full my-10 text-xs lg:text-lg">
                    <a className="text-center lg:text-xl text-lg font-bold mb-4">Inserisci l'email che hai utilizzato per registrarti</a>
                    <input name="email" id="email" className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl focus:outline-none" type="text" placeholder="Email *" required></input>
                    {errorMsg != null?<a className="mx-4 self-center text-red-500">{errorMsg}</a>:""}
                    {message != null?<a className="mx-4 self-center ">{message}</a>:""}
                    <input 
                    type="submit"
                    value="Invia"
                    disabled={message != null}    
                    className={message == null?"border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] font-bold text-white mx-8 mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors self-center":"hidden"}
                    />
                </form>
            :
            <form onSubmit={(e)=>{ sendPasswordResetMessage(e)}} className="flex flex-col h-full my-10 text-xs lg:text-lg">
               <div className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl  flex flex-row">
                <input name="password" id="password" className="focus:outline-none w-full" type={showPassword ? "text" : "password"} placeholder="Password *" required></input>
            
                <button
                    type="button"
                    className="relative top-1/2 transform"
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
                    className="relative top-1/2 transform"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {errorMsg != null?<a className="mx-4 self-center text-red-500">{errorMsg}</a>:""}
            <input 
            type="submit" 
            value="Cambia Password" 
            className="border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] font-bold text-white mx-8 mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors self-center" 
            />
            </form>}
        </div>
        );
}