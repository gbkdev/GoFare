import { Navbar } from "@/components/public/navbar";

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900">About GoFare</h1>
        <p className="mt-4 text-slate-600">
          GoFare helps people in Addis Ababa find the known transport price between two
          locations before they travel. Prices are entered and kept up to date by administrators —
          GoFare is a price reference, not a booking or ride-hailing service.
        </p>
      </div>
    </main>
  );
}
