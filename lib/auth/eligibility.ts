export const AGE_CONFIRMATION_PATH = "/confirm-age";
export const ADULT_ATTESTATION = "imprint_adult_confirmed";
export const ADULT_ONLY_MESSAGE = "Confirm that you’re at least 18 to use Imprint.";

export function hasConfirmedAdultAge(user: { app_metadata: Record<string, unknown> }) {
  return user.app_metadata[ADULT_ATTESTATION] === true;
}
