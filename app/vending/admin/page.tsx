import { redirect } from "next/navigation";

// The vending admin lives as a tab inside the main admin console.
export default function VendingAdminRedirect() {
  redirect("/admin?tab=vending");
}
