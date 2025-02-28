import {
  HomepageSchema,
  BrandSchema,
  ContactPageSchema,
  FooterSchema,
  NavigationBarSchema,
  MediaSchema,
  MedicalSkinExpertPageSchema,
  OrthomolecularTherapistPageSchema,
  OurTeamPageSchema,
  TreatmentsPageSchema,
  TreatmentSchema
} from "./schemas";

export const schemaMap: Record<string, any> = {
  merk: BrandSchema,
  contact: ContactPageSchema,
  footer: FooterSchema,
  homepagina: HomepageSchema,
  media: MediaSchema,
  medischeSkinExpertPage: MedicalSkinExpertPageSchema,
  navigatie: NavigationBarSchema,
  orthomolecularTherapistPage: OrthomolecularTherapistPageSchema,
  onsTeamPagina: OurTeamPageSchema,
  behandeling: TreatmentSchema,
  behandelingenPagina: TreatmentsPageSchema,
};
