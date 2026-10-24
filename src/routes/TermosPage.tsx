import React from "react";
import { LegalLayout } from "../components/LegalLayout";
import { LEGAL_UPDATED_AT, TermsContent } from "../components/LegalContent";

export const TermosPage: React.FC = () => (
  <LegalLayout title="Termos de Serviço" updatedAt={LEGAL_UPDATED_AT}>
    <TermsContent />
  </LegalLayout>
);
