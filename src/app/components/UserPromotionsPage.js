"use client"

import { useState, useEffect } from "react"
import PromotionsComponent from "./PromotionsComponent"
import { request } from "../utils/request"
import Cookies from "js-cookie"
import { decodeJWT } from "../lib/jwtDecode"

export default function UserPromotionsPage({ loadFunction , points }) {
  const [token, setToken] = useState(null)
  const [userPoints, setUserPoints] = useState(points)
  const [loading, setLoading] = useState(true)

  // Carica i dati dell'utente
  const fetchUserData = async (userToken) => {
    try {
      const response = await request({
        url: "/api/user/points", // Endpoint per ottenere i dati utente inclusi i punti
        method: "POST",
        body: {},
        token: userToken,
        loadFunction,
      })

      if (response.ok) {
        setUserPoints(response.data.points || 0)
      }
    } catch (error) {
      console.error("Errore nel caricamento dati utente:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Recupera il token dai cookie
    const userData = Cookies.get("sessionCookie")
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        const decodedToken = decodeJWT(parsedData.token)

        if (decodedToken.payload) {
          setToken(parsedData.token)
          fetchUserData(parsedData.token)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Errore nel parsing del token:", error)
        Cookies.remove("sessionCookie")
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  // Callback per aggiornare i punti dopo un riscatto
  const handleRefresh = () => {
    if (token) {
      fetchUserData(token)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 bg-[#164194] w-5/6">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100] mx-auto"></div>
          <p className="mt-4 text-white mx-auto">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="container mx-auto py-8 px-4 bg-[#164194] w-5/6">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-[#FFD100] mb-4">Accesso richiesto</h2>
          <p className="text-white mb-4">Devi effettuare l'accesso per visualizzare le promozioni.</p>
          <button
            onClick={() => {setIsLoading(true);window.location.href = "/login"}}
            className="bg-[#FFD100] text-[#164194] px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Accedi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="md:rounded-r-2xl rounded-2xl md:rounded-l-none container mx-auto py-8 px-4 bg-[#164194] w-5/6">
      <PromotionsComponent token={token} userPoints={userPoints} onRefresh={handleRefresh} />
    </div>
  )
}
