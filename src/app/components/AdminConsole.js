"use client"

import { useState } from "react"
import ReservationsTable from "./ReservationsTable"
import WelcomeMessageEditor from "./WelcomeMessageEditor"
import PromotionsForm from "./PromotionsForm"
import PointsManagement from "./PointsManagement"
import UsersManagement from "./UsersManagement"
import { request } from "../utils/request"

export default function AdminConsole(params) {
  const [activeTab, setActiveTab] = useState("welcome") // Cambiato il default a "welcome"

  const loadFunction = params.loadFunction
  const token = params.token

  const updatePlaytomicSettings = async () => {
    const response = await request({
      url: "/api/admin/forcePlaytomicSettingsUpdate",
      method: "POST",
      body: {},
      loadFunction,
      token
    });
    if (response.ok) {
      alert("Impostazioni Playtomic aggiornate con successo.");
    } else {
      alert("Errore durante l'aggiornamento delle impostazioni Playtomic.");
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Console di Amministrazione</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("welcome")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "welcome" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Messaggio di Benvenuto
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "reservations" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Gestione Prenotazioni
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "promotions" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Gestione Promozioni
        </button>
        <button
          onClick={() => setActiveTab("points")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "points" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Gestione Punti
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "users" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Gestione Utenti
        </button>
        <button
          onClick={() => updatePlaytomicSettings()}
          className="px-4 py-2 rounded-md transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300">
          Aggiorna Impostazioni Playtomic
        </button>
      </div>

      {activeTab === "welcome" ? (
        <WelcomeMessageEditor loadFunction={loadFunction} token={token} />
      ) : activeTab === "reservations" ? (
        <ReservationsTable loadFunction={loadFunction} token={token} />
      ) : activeTab === "promotions" ? (
        <PromotionsForm loadFunction={loadFunction} token={token} />
      ): activeTab === "points" ? (
        <PointsManagement loadFunction={loadFunction} token={token} />
      ): activeTab === "users" ? (
        <UsersManagement loadFunction={loadFunction} token={token} />
      ):null}
    </div>
  )
}
