"use client";

import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Termo técnico sublinhado que abre a explicação ao tocar (no celular não há
 * "passar o mouse", por isso popover e não tooltip).
 */
export function Termo({
  termo,
  explicacao,
  children,
}: {
  termo: string;
  explicacao: string;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger className="cursor-help underline decoration-dotted underline-offset-4">
        {children}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>{termo}</PopoverTitle>
        <PopoverDescription>{explicacao}</PopoverDescription>
      </PopoverContent>
    </Popover>
  );
}
