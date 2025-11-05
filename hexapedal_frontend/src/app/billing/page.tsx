import AddStripeCard from "../components/payments/AddStripeCard";

export default function BillingPage() {
  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">Add Payment Method</h1>
      <AddStripeCard />
    </div>
  );
}
