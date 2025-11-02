"use client";
import { useState,useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Cookies from "js-cookie";
import { decodeJWT } from "../lib/jwtDecode";
import { request } from "../utils/request";


export default function ModificaPasswordForm({loadFunction}) {

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [token, setToken] = useState(null);
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [marketing, setMarketing] = useState(false);

    async function handleModificaPassword(e) {
        e.preventDefault();

        const marketingResponse = await request({
            url: "/api/user/updateMarketing",
            method: "POST",
            body: {marketing},
            loadFunction,
            token: token,
        });
        if (!marketingResponse.ok) {
            alert("Errore durante l'aggiornamento delle preferenze di marketing");
            return;
        }
        alert("Preferenze di marketing aggiornate con successo");
        const userData = Cookies.get('sessionCookie');
        if (!userData) {
            setIsLoading(true);
            window.location.href = "/login";
            return;
        }
        var parsedData = null;
        try{
            parsedData = JSON.parse(userData);
            parsedData.marketing = marketing ? 'Y' : 'N';
            Cookies.remove('sessionCookie');
            Cookies.set('sessionCookie', JSON.stringify(parsedData), { expires: parsedData.expires });
        }catch (error) {
            
            setIsLoading(true);
            console.error("Errore durante il parsing dei dati dell'utente:", error);
            Cookies.remove('sessionCookie'); // Rimuovi il cookie se c'è un errore
            window.location.href = "/login";
        }

        const formData = new FormData(e.target);
        const password = formData.get("password");
        const passwordConfirm = formData.get("passwordConfirm");
        if (!password || !passwordConfirm) {
            return;
        }
        if (password !== passwordConfirm) {
            alert("Le password non corrispondono");
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>'])[\w\d!@#$%^&*(),.?":{}|<>']{8,}$/;
        if (!passwordRegex.test(password)){
            alert("La password deve contenere almeno 8 caratteri, una lettera e un numero")
            return;
        }
        // Logica per la modifica della password
        //console.log("Modifica password");

        const response = await request({
            url: "/api/user/changePassword",
            method: "POST",
            body: { password },
            loadFunction,
            token
        });
        if (response.ok) {
            alert("Password modificata con successo");
        } else {
            alert("Errore durante la modifica della password");
        }
    }

    useEffect(() => {

            const userData = Cookies.get('sessionCookie');
            if (userData) {
                try{
                const parsedData = JSON.parse(userData);
                setName(parsedData.userName);
                setToken(parsedData.token);
                const decodedToken = decodeJWT(parsedData.token);
                if (decodedToken.payload) {
                    setName(decodedToken.payload.name);
                    setSurname(decodedToken.payload.surname);
                    setEmail(decodedToken.payload.email);
                    setPhone(decodedToken.payload.phone_number);
                    setMarketing(decodedToken.payload.marketing == 'Y'? true : false);
                    document.getElementById("checkbox").checked = decodedToken.payload.marketing == 'Y' ? true : false;
                }
    
                }catch (error) {
                    setIsLoading(true);
                    console.error("Errore durante il parsing dei dati dell'utente:", error);
                    Cookies.remove('sessionCookie'); // Rimuovi il cookie se c'è un errore
                    window.location.href = "/login";
                }
                
            } else{
                setIsLoading(true);
                window.location.href = "/login";
            }
    
      }, []);


    return (
        <form onSubmit={handleModificaPassword} className="md:rounded-r-2xl rounded-2xl md:rounded-l-none flex flex-col w-5/6 md:mx-0 mx-auto bg-[#164194]">
            <div className="mt-10 md:mx-20 mx-5 border-b-1 border-[#F5DA00] ">
                <p className="w-fit text-xl text-white border-b-1 border-white my-5 mb-10">Profilo Utente</p>
                <p className="text-4xl text-[#F5DA00] font-[montserrat] font-bold my-10">Ciao {name} {surname}</p>
            </div>
            <div className="md:mx-20 mx-5 border-b-1 border-[#F5DA00] flex flex-col py-10">
                <div className="w-full flex md:flex-row flex-col justify-center mx-auto">
                    <div className="flex flex-col w-full md:mr-10">
                    <label className="font-bold font-[montserrat] mb-2 text-white" htmlFor="name">Nome</label>
                    <input
                        id="name"
                        name="name"
                        disabled
                        className="mb-6 border-2 py-2 px-4 rounded-3xl focus:outline-none bg-white"
                        type="text"
                        placeholder="Nome"
                        value={name}
                    />
                    </div>
                    <div className="flex flex-col w-full">
                    <label className="font-bold font-[montserrat] mb-2 text-white" htmlFor="surname">Cognome</label>
                    <input
                        id="surname"
                        name="surname"
                        disabled
                        className="mb-6 border-2 py-2 px-4 rounded-3xl focus:outline-none bg-white"
                        type="text"
                        placeholder="Cognome"
                        value={surname}
                    />
                    </div>
                </div>
                <div className="flex w-full md:flex-row flex-col justify-center">
                    <div className="flex flex-col w-full md:mr-10">
                    <label className="font-bold font-[montserrat] mb-2 text-white" htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        disabled
                        className="mb-6 border-2 py-2 px-4 rounded-3xl focus:outline-none bg-white"
                        type="text"
                        placeholder="Email"
                        value={email}
                    />
                    </div>
                    <div className="flex flex-col w-full">
                    <label className="font-bold font-[montserrat] mb-2 text-white" htmlFor="phone">Telefono</label>
                    <input
                        id="phone"
                        name="phone"
                        disabled
                        className="mb-6 border-2 py-2 px-4 rounded-3xl focus:outline-none bg-white"
                        type="text"
                        placeholder="Telefono"
                        value={phone}
                    />
                    </div>
                </div>
            </div>
            <div className="md:mx-20 mx-5 flex flex-col py-10 ">
                <p className="text-2xl text-[#F5DA00] font-[montserrat] font-bold mb-5">Modifica Password</p>
                <div className="w-full flex md:flex-row flex-col justify-center">
                    <div className="w-full flex flex-col md:mr-10">
                        <label className="font-bold font-[montserrat] mb-2 text-white" htmlFor="password">Nuova Password</label>
                        <div className=" mb-6 border-2 py-2 px-4 rounded-3xl flex flex-row bg-white">             
                            <input name="password" id="password" className="focus:outline-none w-full" type={showPassword ? "text" : "password"} placeholder="Password *"></input>
                            <button
                                type="button"
                                className="relative md:top-1/2 transform lg:-translate-y-1/2"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="w-full flex flex-col ">
                        <label className="font-bold font-[montserrat] mb-2 text-white" htmlFor="passwordConfirm">Conferma Password</label>
                        <div className="mb-6  border-2 py-2 px-4 rounded-3xl  flex flex-row bg-white">
                        <input name="passwordConfirm" id="passwordConfirm" className="focus:outline-none w-full" type={showConfirmPassword ? "text" : "password"} placeholder="Conferma Password *"> 
                        </input>
                        <button
                            type="button"
                            className="relative md:top-1/2 transform lg:-translate-y-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    </div>
                </div>
                <div className="flex flex-row w-full">
                    <input type="checkbox" id="checkbox" name="marketingConsent" className=" h-full" onChange={()=>setMarketing(!marketing)}/>
                    <label className="font-bold font-[montserrat] mx-2 text-white" htmlFor="marketingConsent">
                        Consenso per le comunicazioni di marketing, necessario per accumulare punti
                    </label>
                </div>
                <input
                    type="submit"
                    value="SALVA MODIFICHE"
                    className="border-0 rounded-4xl text-sm lg:text-lg bg-[#001F3F] self-end font-bold text-white mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors"
                />
            </div>
        </form>
    )
}