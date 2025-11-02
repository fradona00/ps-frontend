"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/Badge"
import { Gift, Star, Zap, RefreshCw, AlertCircle, Sparkles, Copy, Check, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog"
import { request } from "../utils/request"

export default function PromotionsComponent({ token, userPoints = 0, onRefresh }) {
  const [promotions, setPromotions] = useState([])
  const [userPromos, setUserPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [redeeming, setRedeeming] = useState({}) // Per gestire lo stato di riscatto per ogni promo
  const [copying, setCopying] = useState({}) // Per gestire lo stato di copia per ogni codice
  const [receptionDialogOpen, setReceptionDialogOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState(null)

  // Carica le promozioni
  const fetchPromotions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await request({
        url: "/api/user/getAvailablePromo",
        method: "POST",
        body: {},
        token,
        loadFunction: setLoading,
      })

      if (response.ok) {
        setPromotions(response.data.promotions || [])
      } else {
        setError("Errore nel caricamento delle promozioni")
      }
    } catch (err) {
      setError("Errore di connessione")
      console.error("Errore nel caricamento promozioni:", err)
    } finally {
      setLoading(false)
    }
  }

  // Carica le promozioni già riscattate dall'utente
  const fetchUserPromos = async () => {
    try {
      const response = await request({
        url: "/api/user/getUserPromos",
        method: "POST",
        body: {},
        token,
      })

      if (response.ok) {
        setUserPromos(response.data.promotions || [])
      } else {
        console.error("Errore nel caricamento promozioni utente:", response.data?.message)
      }
    } catch (err) {
      console.error("Errore nel caricamento promozioni utente:", err)
    }
  }

  useEffect(() => {
    if (token) {
      fetchPromotions()
      fetchUserPromos()
    }
  }, [token])

  // Gestisce il riscatto di una promozione
  const handleRedeem = async (promo) => {
    // Se è di tipo "other", mostra il popup invece di chiamare l'API
    if (promo.type === "other") {
      setSelectedPromotion(promo)
      setReceptionDialogOpen(true)
      return
    }

    setRedeeming((prev) => ({ ...prev, [promo.id]: true }))

    try {
      const response = await request({
        url: "/api/user/redeemPromo",
        method: "POST",
        body: { promotionId: promo.id },
        token,
      })

      if (response.ok) {
        alert("Promozione riscattata con successo!")
        fetchPromotions() // Ricarica le promozioni
        fetchUserPromos() // Ricarica le promozioni utente
        onRefresh && onRefresh() // Callback per aggiornare i punti dell'utente
      } else {
        alert(response.data?.message || "Errore nel riscatto della promozione")
      }
    } catch (error) {
      console.error("Errore nel riscatto:", error)
      alert("Errore nel riscatto della promozione")
    } finally {
      setRedeeming((prev) => ({ ...prev, [promo.id]: false }))
    }
  }

  // Gestisce la copia del codice negli appunti
  const handleCopyCode = async (code, promoId) => {
    setCopying((prev) => ({ ...prev, [promoId]: true }))

    try {
      await navigator.clipboard.writeText(code)

      // Feedback visivo temporaneo
      setTimeout(() => {
        setCopying((prev) => ({ ...prev, [promoId]: false }))
      }, 2000)
    } catch (err) {
      console.error("Errore nella copia:", err)
      // Fallback per browser che non supportano clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      setTimeout(() => {
        setCopying((prev) => ({ ...prev, [promoId]: false }))
      }, 2000)
    }
  }

  // Determina il tipo di promozione basato sul titolo o descrizione
  const getPromotionType = (title, description, type) => {
    if (type === "other") {
      return { type: "prize", icon: <Gift className="h-5 w-5" />, color: "bg-purple-100 text-purple-800" }
    }

    const text = (title + " " + description).toLowerCase()

    if (text.includes("sconto") || text.includes("discount") || text.includes("%")) {
      return { type: "discount", icon: <Zap className="h-5 w-5" />, color: "bg-orange-100 text-orange-800" }
    } else if (text.includes("gratis") || text.includes("free") || text.includes("omaggio")) {
      return { type: "free", icon: <Gift className="h-5 w-5" />, color: "bg-green-100 text-green-800" }
    } else if (text.includes("premium") || text.includes("vip") || text.includes("esclusiv")) {
      return { type: "premium", icon: <Star className="h-5 w-5" />, color: "bg-purple-100 text-purple-800" }
    } else {
      return { type: "special", icon: <Sparkles className="h-5 w-5" />, color: "bg-blue-100 text-blue-800" }
    }
  }

  // Estrae i punti necessari dalla descrizione (se presenti)
  const extractPointsRequired = (description) => {
    const match = description.match(/(\d+)\s*punt[oi]/i)
    return match ? Number.parseInt(match[1]) : null
  }

  // Verifica se l'utente può riscattare la promozione
  const canRedeem = (pointsRequired) => {
    return pointsRequired ? userPoints >= pointsRequired : true
  }

  // Verifica se la promozione è già stata riscattata
  const isAlreadyRedeemed = (promoId) => {
    return userPromos.find((userPromo) => userPromo.PROMOTION_ID === promoId)
  }

  // Ottiene il codice della promozione riscattata
  const getRedeemedCode = (promoId) => {
    const userPromo = userPromos.find((userPromo) => userPromo.PROMOTION_ID === promoId)
    return userPromo?.codice || null
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#FFD100]">Promozioni Disponibili</h2>
          <div className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 text-[#FFD100]" />
            <span>{userPoints} punti</span>
          </div>
        </div>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD100] mx-auto"></div>
          <p className="mt-4 text-white">Caricamento promozioni...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#FFD100]">Promozioni Disponibili</h2>
          <div className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 text-[#FFD100]" />
            <span>{userPoints} punti</span>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-8 bg-white rounded-lg">
            <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Errore</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                fetchPromotions()
                fetchUserPromos()
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (promotions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#FFD100]">Promozioni Disponibili</h2>
          <div className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 text-[#FFD100]" />
            <span>{userPoints} punti</span>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12 bg-white rounded-lg">
            <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna promozione disponibile</h3>
            <p className="text-gray-600 mb-4">Al momento non ci sono promozioni attive.</p>
            <Button
              onClick={() => {
                fetchPromotions()
                fetchUserPromos()
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con punti utente */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-[#FFD100]">Promozioni Disponibili</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <Star className="h-5 w-5 text-[#FFD100]" />
            <span className="text-white font-semibold">{userPoints} punti disponibili</span>
          </div>
          <Button
            onClick={() => {
              fetchPromotions()
              fetchUserPromos()
            }}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-[#FFD100] hover:text-[#164194]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Griglia promozioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => {
          const promoType = getPromotionType(promo.title, promo.description, promo.type)
          const pointsRequired = promo.points
          const canRedeemPromo = canRedeem(promo.points)
          const isRedeeming = redeeming[promo.id]
          const alreadyRedeemed = isAlreadyRedeemed(promo.id)
          const redeemedCode = getRedeemedCode(promo.id)
          const isCopying = copying[promo.id]

          return (
            <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Header della card con tipo promozione */}
              <div
                className={`p-4 text-white ${
                  alreadyRedeemed
                    ? "bg-gradient-to-r from-green-600 to-green-700"
                    : promo.type === "other"
                      ? "bg-gradient-to-r from-purple-600 to-purple-700"
                      : "bg-gradient-to-r from-[#164194] to-[#1e4ba8]"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {promoType.icon}
                    <Badge className={promoType.color}>{promoType.type.toUpperCase()}</Badge>
                  </div>
                  {alreadyRedeemed && <Badge className="bg-white/20 text-white">RISCATTATA</Badge>}
                  {!alreadyRedeemed && pointsRequired && (
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                      <Star className="h-3 w-3" />
                      <span className="text-xs font-medium">{pointsRequired} pt</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold leading-tight">{promo.title}</h3>
              </div>

              {/* Contenuto della card */}
              <CardContent className="h-full p-4 bg-white">
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{promo.description}</p>

                {/* Stato punti - solo se non è già riscattata */}
                {!alreadyRedeemed && pointsRequired && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                      <span>Punti richiesti</span>
                      <span>
                        {userPoints}/{pointsRequired}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          canRedeemPromo ? "bg-green-500" : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min((userPoints / pointsRequired) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Codice promozionale se già riscattata e di tipo discount */}
                {alreadyRedeemed && redeemedCode && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-1">Il tuo codice:</p>
                        <p className="text-lg font-bold text-green-900 font-mono">{redeemedCode}</p>
                      </div>
                      <Button
                        onClick={() => handleCopyCode(redeemedCode, promo.id)}
                        size="sm"
                        variant="outline"
                        className={`${
                          isCopying
                            ? "bg-green-100 border-green-300 text-green-700"
                            : "hover:bg-green-100 hover:border-green-300"
                        }`}
                      >
                        {isCopying ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copiato!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copia
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messaggio per premi già riscattati di tipo "other" */}
                {alreadyRedeemed && promo.type === "other" && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-800 mb-1">Premio riscattato!</p>
                        <p className="text-sm text-purple-700">Ritira il tuo premio in reception</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pulsante azione */}
                {alreadyRedeemed ? (
                  <div className="text-center py-2">
                    <p className="text-green-600 font-medium flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      {promo.type === "other" ? "Premio riscattato" : "Promozione già riscattata"}
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleRedeem(promo)}
                    disabled={!canRedeemPromo || isRedeeming}
                    className={`w-full ${
                      canRedeemPromo
                        ? promo.type === "other"
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-[#164194] hover:bg-[#1e4ba8] text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isRedeeming ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Riscattando...
                      </>
                    ) : !canRedeemPromo && pointsRequired ? (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Punti insufficienti
                      </>
                    ) : (
                      <>
                        {promo.type === "other" ? (
                          <>
                            <MapPin className="h-4 w-4 mr-2" />
                            Riscatta premio
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Riscatta ora
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Footer informativo */}
      <Card>
        <CardContent className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Come funzionano i punti?</h4>
              <p className="text-sm text-blue-700">
                Accumula punti con ogni prenotazione e riscattali per ottenere sconti esclusivi e promozioni speciali. I punti possono essere utilizzati in qualsiasi momento
                e <a className="font-bold">hanno validità entro la fine dell'anno corrente.</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog per premi da ritirare in reception */}
      <Dialog open={receptionDialogOpen} onOpenChange={setReceptionDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <MapPin className="h-5 w-5" />
              Ritiro in Reception
            </DialogTitle>
            <DialogDescription className="text-center py-4">
              <div className="mb-4">
                <Gift className="h-16 w-16 mx-auto text-purple-500 mb-2" />
                <h3 className="font-semibold text-lg mb-2">{selectedPromotion?.title}</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Per riscattare questo premio è necessario recarsi in reception e chiedere di riscattare il premio.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setReceptionDialogOpen(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Ho capito
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
