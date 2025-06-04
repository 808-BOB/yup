
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import YupLogo from "@assets/Yup-logo.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState("Do you party?");
  const [showSecondary, setShowSecondary] = useState(false);
  const { accessibleTextColor, primaryColor } = useAccessibleColors();

  const handleResponse = () => {
    if (!showSecondary) {
      setQuestion("Want to?");
      setShowSecondary(true);
    } else {
      setLocation("/signup");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 sm:pt-24 bg-gray-950 px-4">
      <img src={YupLogo} alt="Yup.RSVP" className="h-12 sm:h-16 mb-12" />
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-8 text-white">{question}</h1>
        <div className="space-x-4">
          <Button
            onClick={handleResponse}
            className="hover:bg-primary/90 text-xl px-8 py-6 h-auto"
            style={{
              backgroundColor: primaryColor || 'hsl(308, 100%, 66%)',
              color: accessibleTextColor
            }}
          >
            Yup
          </Button>
          <Button
            onClick={handleResponse}
            variant="outline"
            className="text-xl px-8 py-6 h-auto"
          >
            Nope
          </Button>
        </div>
      </div>

      <div className="mt-14 flex gap-4 text-sm text-gray-400">
        <button 
          onClick={() => setLocation("/upgrade")} 
          className="hover:text-white transition-colors"
        >
          Plans
        </button>
        <span>•</span>
        <button 
          onClick={() => setLocation("/login")} 
          className="hover:text-white transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  );
}
