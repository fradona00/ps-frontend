"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/TextArea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { request } from "../utils/request"
// import { useToast } from "@/components/ui/use-toast"

export default function WelcomeMessageEditor({ loadFunction, token }) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const hasFetched = useRef(false)
  // const { toast } = useToast()

  // Carica il messaggio di benvenuto attuale all'avvio del componente
  useEffect(() => {
    if (!hasFetched.current) {
      fetchWelcomeMessage()
      hasFetched.current = true
    }
  }, [])

  // Funzione per recuperare il messaggio di benvenuto attuale
  const fetchWelcomeMessage = async () => {

    try {
      const response = await request({
        url: "/api/user/getWelcomeMessage",
        method: "POST",
        loadFunction,
      })

      if (response && response.ok && response.data) {
        setTitle(response.data.title || "")
        setMessage(response.data.message || "")
      }
    } catch (error) {
      console.error("Errore nel recupero del messaggio di benvenuto:", error)
      // toast({
      //   title: "Errore",
      //   description: "Impossibile recuperare il messaggio di benvenuto",
      //   variant: "destructive",
      // })
      alert("Errore: Impossibile recuperare il messaggio di benvenuto")
    }
  }

  // Funzione per gestire l'invio del form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await request({
        url: "/api/admin/updateWelcomeMessage",
        method: "POST",
        body: {
          title,
          message,
        },
        token,
        loadFunction,
      })

      if (response && response.ok) {
        // toast({
        //   title: "Successo",
        //   description: "Messaggio di benvenuto aggiornato con successo",
        //   variant: "success",
        // })
        alert("Successo: Messaggio di benvenuto aggiornato con successo")
      } else {
        throw new Error(response?.data?.message || "Errore durante l'aggiornamento")
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento del messaggio di benvenuto:", error)
      // toast({
      //   title: "Errore",
      //   description: error.message || "Impossibile aggiornare il messaggio di benvenuto",
      //   variant: "destructive",
      // })
      alert("Errore: " + (error.message || "Impossibile aggiornare il messaggio di benvenuto"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white text-black">
      <CardHeader>
        <CardTitle>Modifica Messaggio di Benvenuto</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inserisci il titolo del messaggio di benvenuto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Messaggio</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Inserisci il messaggio di benvenuto"
              rows={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={fetchWelcomeMessage} disabled={loading}>
            Annulla
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvataggio in corso..." : "Salva modifiche"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
