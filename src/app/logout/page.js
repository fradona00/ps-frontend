"use client";
import { useEffect } from "react";
import Cookies from 'js-cookie';

export default function LogoutPage() {

    useEffect(() => {
        // Rimuovi il cookie di sessione
        Cookies.remove('sessionCookie');
        // Reindirizza alla pagina di login
        window.location.href = "/login";
    }, []);

    return (
        <div></div>
    );
  }