import { Link } from "wouter";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <Link href="/">
          <a className="text-2xl font-bold">
            yup<span className="text-primary">.rsvp</span>
          </a>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/events/create">
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 transition">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-200 dark:bg-gray-700 w-8 h-8 flex items-center justify-center"
        >
          <span className="text-sm font-medium">DU</span>
        </Button>
      </div>
    </header>
  );
}
