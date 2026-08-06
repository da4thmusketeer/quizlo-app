"use client";

import React from "react";
import { GoeyToaster } from "goey-toast";

export default function ToasterProvider() {
  return <GoeyToaster position="top-center" duration={4000} closeButton />;
}
