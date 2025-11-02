"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { Eye, EyeOff } from "lucide-react";
import { request } from '../utils/request';
import Cookies from 'js-cookie';
import { is } from "date-fns/locale";

export default function LoginForm(params) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const loadFunction = params.loadFunction;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const interval = setInterval(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          clearInterval(interval);
          initGoogleLogin();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  async function initGoogleLogin() {
    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const idToken = response.credential;
        const rememberMe = document.querySelector('input[name="rememberMe"]').checked;
        const isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';

        const backendResponse = await request({
          url: "/api/user/googleLogin",
          method: "POST",
          body: { googletoken: idToken, rememberMe },
          loadFunction,
        });

        if (backendResponse.data?.token) {
          let expire = null;
          if (rememberMe) {
            expire = { expires: 30 };
          }
          Cookies.set('sessionCookie', JSON.stringify(backendResponse.data), expire);
          loadFunction(true);
          
          if (!isPopup) {
            window.location.href = "/";
            return;
          }
          if (isPopup && window.opener) {
            window.opener.postMessage(
              { type: 'LOGIN_SUCCESS' },
              window.location.origin
            );
            window.close();
          }
        } else if (backendResponse.data?.type === "register") {
          let googleUser = backendResponse.data.googleUser;
          loadFunction(true);
          let popup = isPopup ? "&popup=true" : "";
          window.location.href = "/register?name="+googleUser.name+"&surname="+googleUser.surname+"&email="+googleUser.email+popup;
        } else {
          alert("Errore nel login con Google.");
        }
      },
    });

    google.accounts.id.renderButton(document.getElementById("googleButton"), {
      theme: "outline",
      size: "large",
    });
  }

  async function sendMessage(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const rememberMe = formData.get("rememberMe");
    const isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';

    const response = await request({
      url: "/api/user/login",
      method: "POST",
      body: { email, password, rememberMe },
      loadFunction,
    });

    if (response.data.token != null) {
      setLoginError(false);
      let expire = null;
      if (rememberMe) {
        expire = { expires: 30 };
      }
      Cookies.set('sessionCookie', JSON.stringify(response.data), expire);
      const reservationRedirect = new URLSearchParams(window.location.search).get("reservation");
      loadFunction(true);
      if (reservationRedirect === "true") {
        window.location.href = "/reservation";
      } else {
        if (!isPopup) {
          window.location.href = "/";
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
    } else {
      setLoginError(true);
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div className="lg:w-2/5 w-full rounded-2xl bg-white lg:ml-20 lg:mb-15 mb-5 text-black drop-shadow-2xl shadow-2xl">
        <form onSubmit={sendMessage} className="flex flex-col h-full my-10 text-sm lg:text-lg">
          <input
            id="email"
            name="email"
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl focus:outline-none"
            type="text"
            placeholder="Email *"
            required
          />
          <div className="mb-6 lg:mx-8 mx-4 border-2 py-2 px-4 rounded-3xl flex flex-row">
            <input
              id="password"
              name="password"
              className="focus:outline-none w-full"
              type={showPassword ? "text" : "password"}
              placeholder="Password *"
              required
            />
            <button
              type="button"
              className="relative top-1/2 transform lg:-translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="flex flex-row lg:mx-8 mx-4">
            <input type="checkbox" name="rememberMe" className="mx-2" />
            <a>Ricordami</a>
          </div>
          <div className="flex flex-row lg:mx-8 mx-4">
            <a href="/resetPassword" className="underline text-[#164194] cursor-pointer">
              Password dimenticata?
            </a>
          </div>

          {loginError && <a className="text-red-500 self-center">Email o password errate.</a>}
          <div className="flex flex-row flex-wrap items-center justify-center">
            <input
              type="submit"
              value="Accedi"
              className="border-0 rounded-4xl text-sm lg:text-lg bg-[#164194] font-bold text-white mx-8 mt-4 py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors self-center"
            />
            <div id="googleButton" className="mt-4 font-[oswald]" />
          </div>
        </form>
      </div>
    </>
  );
}
