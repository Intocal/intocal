// "use client" is required: <InlineWidget> uses hooks, and onBookingCreated is a
// function prop. In the App Router, passing a function from a Server Component to
// a Client Component throws at render time.
"use client";

import { InlineWidget, PopupButton } from "@intocal/react";

export default function Page() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Book a 30-minute intro</h1>
      <p>Pick a time that works for you. Confirmation hits your inbox instantly.</p>

      <InlineWidget
        user="jane"
        eventType="intro-30"
        prefill={{ utm_source: "website", utm_medium: "homepage" }}
        onBookingCreated={(b) => {
          console.log("booked", b.id);
        }}
      />

      <PopupButton user="jane" eventType="intro-30">
        Or open in a popup
      </PopupButton>
    </main>
  );
}
