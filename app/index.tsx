import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import SplashScreen from "./splash";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      router.replace("/home");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return showSplash ? <SplashScreen /> : null;
}
