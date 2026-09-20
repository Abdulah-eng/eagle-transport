"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const GOOGLE_REVIEW_LINK =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_LINK || "https://www.google.com/maps/search/Eagle+Bus+Transportation"

function ReviewContent() {
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")
  const token = searchParams.get("token")

  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)
    setErrorMessage("")

    const goToGoogle = rating >= 4

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: tripId || undefined,
          token: token || undefined,
          rating,
          feedback,
          redirectedToGoogle: goToGoogle,
        }),
      })
    } catch (err) {
      // Non-blocking — we still show success even if save fails
      console.warn("[Review] Failed to save review:", err)
    }

    setIsSubmitting(false)
    setSubmitted(true)

    if (goToGoogle) {
      setTimeout(() => {
        window.open(GOOGLE_REVIEW_LINK, "_blank", "noopener,noreferrer")
      }, 2000)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-3xl">Thank You!</CardTitle>
            <CardDescription className="text-lg mt-2">
              We appreciate your feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rating >= 4 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We&apos;re thrilled you had a great experience! We&apos;re opening Google Reviews so you can share it with others.
                </p>
                <div className="animate-pulse flex space-x-2 justify-center py-4">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div className="w-3 h-3 bg-primary rounded-full" style={{ animationDelay: "200ms" }}></div>
                  <div className="w-3 h-3 bg-primary rounded-full" style={{ animationDelay: "400ms" }}></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  If it didn&apos;t open,{" "}
                  <a
                    href={GOOGLE_REVIEW_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    click here to leave a Google review
                  </a>
                  .
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Your feedback helps us improve our service. A member of our team may reach out to you shortly to discuss your experience.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 flex flex-col items-center justify-center">
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl font-heading">
          Eagle Bus Service
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          How was your trip?
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-2xl border-t-4 border-t-primary animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader className="text-center">
          <CardTitle>Rate Your Experience</CardTitle>
          <CardDescription>
            Please let us know how we did. We value your feedback!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-12 w-12 transition-colors ${(hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>

          <div className={`space-y-2 transition-opacity duration-300 ${rating > 0 ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
            <Label htmlFor="feedback">Any additional comments? (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="resize-none h-32"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch pt-2">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full text-lg h-14"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading review form...</div>}>
      <ReviewContent />
    </Suspense>
  )
}
