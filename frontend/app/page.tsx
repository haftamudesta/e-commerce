import ProtectedRoute from "@/components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <main>
        <h1>Ecommerce App</h1>
      </main>
    </ProtectedRoute>
  );
}
