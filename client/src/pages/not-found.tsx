import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950">
      <Card className="w-full max-w-md mx-4 bg-gray-900 border border-gray-800">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold uppercase tracking-tight">404 NOT FOUND</h1>
          </div>

          <p className="mt-4 text-center text-gray-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex justify-center">
            <Link href="/">
              <Button className="btn-primary">
                BACK TO HOME
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
