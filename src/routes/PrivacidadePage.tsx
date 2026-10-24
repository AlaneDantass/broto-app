import React from "react";
import { LegalLayout } from "../components/LegalLayout";
import { LEGAL_UPDATED_AT, PrivacyContent } from "../components/LegalContent";

export const PrivacidadePage: React.FC = () => (
  <LegalLayout title="Política de Privacidade" updatedAt={LEGAL_UPDATED_AT}>
    <PrivacyContent />
  </LegalLayout>
);
