"use client"

import { useState, useEffect,useRef } from "react"
import UserReservationsTable from "./UserReservationsTable"
import { request } from "../utils/request"

export default function UserDashboard({ token, loadFunction }) {
  const [reservations, setReservations] = useState([])
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasFetched = useRef(false)

  // Carica le prenotazioni dell'utente
  const fetchUserReservations = async () => {
    if (hasFetched.current) return
    hasFetched.current = true
    setLoading(true)
    setError(null)

    try {
      // Carica i campi
      const courtsResponse = await request({
        url: "/api/services/getCourts",
        method: "POST",
        body: {},
        loadFunction,
      })

      if (courtsResponse.ok) {
        setCourts(courtsResponse.data)
      }

      // Carica le prenotazioni dell'utente
      const reservationsResponse = await request({
        url: "/api/user/getReservations",
        method: "POST",
        body: {},
        token,
        loadFunction,
      })

      if (reservationsResponse.ok) {
        setReservations(reservationsResponse.data.reservations || [])
      } else {
        if (!reservations){
          setError("Errore nel caricamento delle prenotazioni")
        }
      }
    } catch (err) {
      setError("Errore di connessione")
      console.error("Errore nel caricamento:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      if (!hasFetched.current) {
      fetchUserReservations()
        hasFetched.current = true
      }
    }
  }, [token])

  // Gestisce la visualizzazione dei dettagli
  const handleViewDetails = (reservation) => {
    console.log("Visualizza dettagli:", reservation)
    // Implementa la logica per mostrare i dettagli
    alert(`Dettagli prenotazione:\nCampo: ${reservation.RESOURCE_ID}\nData: ${reservation.START_DATE}`)
  }

  // Gestisce la cancellazione
  const handleCancelReservation = async (reservation) => {
    if (confirm("Sei sicuro di voler cancellare questa prenotazione?")) {
      try {
        const response = await request({
          url: "/api/user/cancelReservation", // Endpoint da implementare
          method: "POST",
          body: {
            reservationId: reservation.RESERVATION_ID, // Assumendo che ci sia questo campo
          },
          token,
          loadFunction,
        })

        if (response.ok) {
          alert("Prenotazione cancellata con successo")
          fetchUserReservations() // Ricarica la lista
        } else {
          alert("Errore nella cancellazione della prenotazione")
        }
      } catch (error) {
        console.error("Errore nella cancellazione:", error)
        alert("Errore nella cancellazione della prenotazione")
      }
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center p-8 text-red-500">
          <p>Errore: {error}</p>
          <button
            onClick={()=>fetchUserReservations()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className=" mx-auto md:py-8 md:px-4 bg-[#164194] w-full min-h-full">
      <UserReservationsTable
        reservations={reservations}
        courts={courts}
        loading={loading}
        onRefresh={()=>fetchUserReservations}
        onViewDetails={handleViewDetails}
        onCancelReservation={handleCancelReservation}
      />
    </div>
  )
}
