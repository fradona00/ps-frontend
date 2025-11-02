"use client";
import Navbar from "../components/Navbar";
import { useEffect, useState } from 'react';
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import CookieConsent from "react-cookie-consent";
import { request } from "../utils/request";
import Cookies from "js-cookie";
import { set } from "date-fns";

export default function cancelOrderPage() {

    async function cancelOrder() {
        const token = await JSON.parse(Cookies.get("sessionCookie")).token;

        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const response = await request({
            url: "/api/services/cancelOrder",
            method: "POST",
            body: { orderId },
            token
        });
        setIsLoading(true);
        window.location.href = '/';
    }

    useEffect(() => {

        cancelOrder();

      }, []);

    return (<div></div>
      
    );
  }