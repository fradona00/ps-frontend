"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "../components/image.png";
import Cookies from 'js-cookie';
import { decodeJWT } from "../lib/jwtDecode";

export default function Navbar({loadFunction}) {

  const [visible, setVisible] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  let lastScrollY = 0;

  function toggleNavbar() {
    document.getElementById("navbar-open").checked = false;
  }

  useEffect(() => {
    loadFunction(true);
    const userData = Cookies.get('sessionCookie');
    if (userData) {
      try{
        const parsedData = JSON.parse(userData);
        setUserName(parsedData.userName);
        setIsLoggedIn(true);
        const decodedToken = decodeJWT(parsedData.token);
        if (decodedToken.payload) {
          if (decodedToken.payload.admin === true) {
            setIsAdmin(true);
          }
        }
      }catch (error) {
        console.error("Errore durante il parsing dei dati dell'utente:", error);
        Cookies.remove('sessionCookie'); // Rimuovi il cookie se c'è un errore
      }
    }
    loadFunction(false);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setVisible(false); // Nasconde la navbar quando scrolli in basso
        toggleNavbar();
      } else {
        setVisible(true); // Mostra la navbar quando scrolli in alto
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);

  }, []);

  return (
    <div className={`font-[oswald] font-medium z-50 fixed top-0 left-0 bg-white flex max-w-screen-xl flex-col min-w-full overflow-hidden px-4 py-4 lg:mx-auto lg:flex-row items-center transition-transform duration-300 ${
      visible ? "translate-y-0" : "-translate-y-full"
    }`}>
      <a href="/" className="">
        <Image alt="logo" src={logo} width={150}/>
      </a>
      <input type="checkbox" className="peer hidden" id="navbar-open" />
      <label className="top-7 left-4 cursor-pointer lg:hidden absolute" htmlFor="navbar-open">
        <span className="sr-only">Toggle Navigation</span>
        <Image src="/burgerMenu.svg" alt="hamburger" width={25} height={25}/>
      </label>
      <nav aria-label="Header Navigation" className="peer-checked:mt-4 peer-checked:max-h-fit flex max-h-0 w-full flex-col items-center justify-between overflow-hidden transition-all lg:ml-24 lg:max-h-full lg:flex-row lg:items-center">
        <ul className="flex flex-col items-center space-y-2 lg:ml-auto lg:flex-row lg:space-y-0">
          <li onClick={toggleNavbar} className="text-gray-600 lg:mr-12 hover:text-blue-600"><a href="/reservation">PRENOTA ORA</a></li>
          <li onClick={toggleNavbar} className="text-gray-600 lg:mr-12 hover:text-blue-600"><a href="/servizi">SERVIZI</a></li>
          <li onClick={toggleNavbar} className="text-gray-600 lg:mr-12 hover:text-blue-600"><a href="/#contatti">CONTATTI</a></li>
          <li onClick={toggleNavbar} className="text-gray-600 lg:mr-12 hover:text-blue-600">
          <div className="flex flex-col md:flex-row items-center">
          {!isLoggedIn?<a href="/login">
            <button className="rounded-md border-2 border-blue-600 px-6 py-1 font-medium text-blue-600 transition-colors hover:cursor-pointer hover:bg-blue-600 hover:text-white">Login</button>
          </a>:<a href="/profile">
            <button className="rounded-md border-2 border-blue-600 px-6 py-1 font-medium text-blue-600 transition-colors hover:cursor-pointer hover:bg-blue-600 hover:text-white">Ciao {userName}</button>
          </a>}
          {isLoggedIn?<a className="text-red-500 hover:text-blue-600 md:ml-8 mt-2 md:mt-0" href="/logout">LOGOUT</a>:""}
          {isLoggedIn && isAdmin?<a className=" ml-0 mt-2 md:mt-0 md:ml-4 rounded-md border-2 px-6 py-1 font-medium text-blue-600 transition-colors hover:cursor-pointer hover:bg-blue-600 hover:text-white" href="/adminConsole">ADMIN CONSOLE</a>:""}
          </div>
          </li>
        </ul>
      </nav>
    </div>

  )
}
