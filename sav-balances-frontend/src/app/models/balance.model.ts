import { Client } from "./client.model";
import { Intervention } from "./intervention.model";

export interface Balance {
  id?: number;
  reference: string;
  montant: number;
  categorie?: string;
  dateCreation: string;
  description: string;
  notes?: string;
}